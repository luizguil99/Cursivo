import React, { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAvatarUrl, getInitials, getDisplayName } from "@/utils/avatar";
import RichTextEditor from "@/components/community/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export default function DiscussionCard({
  discussion,
  currentUser,
  onLike,
  onComment,
  onDelete,
  isLiking,
  isCommenting,
  activeDiscussion,
  commentText,
  setCommentText,
  onCancelComment,
  onSubmitComment,
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [discussionUser, setDiscussionUser] = useState(null);

  useEffect(() => {
    const loadDiscussionUser = async () => {
      if (discussion.usuario_id !== currentUser?.id) {
        try {
          const { data: perfil } = await supabase
            .from("perfis")
            .select("nome, user_metadata")
            .eq("id", discussion.usuario_id)
            .single();

          if (perfil) {
            setDiscussionUser({
              ...perfil,
              user_metadata: {
                ...perfil.user_metadata,
                avatar_url: perfil.user_metadata?.avatar_url,
                avatar_style: perfil.user_metadata?.avatar_style,
                avatar_seed: perfil.user_metadata?.avatar_seed,
              }
            });
          }
        } catch (error) {
          console.error("Erro ao carregar usuário da discussão:", error);
        }
      }
    };

    loadDiscussionUser();
  }, [discussion.usuario_id, currentUser?.id]);

  const formatDate = (date) => {
    if (!date) {
      console.warn("Data inválida:", date);
      return "Data inválida";
    }

    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn("Data inválida após parse:", date);
        return "Data inválida";
      }

      return formatDistanceToNow(parsedDate, {
        addSuffix: true,
        locale: ptBR,
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  const isOwner = discussion.usuario_id === currentUser?.id;

  const handleDelete = () => {
    onDelete(discussion.id);
    setShowDeleteDialog(false);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-border">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10 ring-2 ring-white">
            <AvatarImage
              src={
                discussion.usuario_id === currentUser?.id
                  ? currentUser?.user_metadata?.avatar_url
                  : discussionUser?.user_metadata?.avatar_url
              }
              alt={getDisplayName(discussion)}
            />
            <AvatarFallback>
              {getInitials(getDisplayName(discussion))}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-foreground">
                  {discussion.usuario_id === currentUser?.id
                    ? currentUser?.user_metadata?.nome || "Admin"
                    : discussionUser?.nome || "Admin"}
                </p>
                <span className="text-sm text-muted-foreground">
                  {formatDate(discussion.criado_em)}
                </span>
              </div>
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <Dialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Excluir publicação</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja excluir esta publicação? Esta
                          ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleDelete} variant="destructive">
                          Excluir
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
            <div
              className="mt-1 text-sm text-foreground break-words"
              dangerouslySetInnerHTML={{
                __html: discussion.conteudo,
              }}
            />
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={() => onLike(discussion.id)}
                disabled={isLiking}
                className={`flex items-center space-x-1 ${
                  discussion.curtidas
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">
                  {discussion.curtidas || 0} Curtir
                </span>
              </button>
              <button
                onClick={() => onComment(discussion.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">
                  {discussion.comentarios_count || 0} Comentar
                </span>
              </button>
              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Compartilhar</span>
              </button>
            </div>

            {activeDiscussion === discussion.id && isCommenting && (
              <div className="mt-4">
                <RichTextEditor
                  value={commentText}
                  onChange={(value) => setCommentText(value)}
                  placeholder="Escreva seu comentário..."
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={onCancelComment}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => onSubmitComment(discussion.id)}
                    disabled={!commentText.trim()}
                  >
                    Comentar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de comentários */}
            {discussion.comentarios && discussion.comentarios.length > 0 && (
              <div className="mt-4 space-y-4">
                {discussion.comentarios.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 ring-1 ring-white">
                      <AvatarImage
                        src={
                          comment.usuario_id === currentUser?.id
                            ? currentUser?.user_metadata?.avatar_url
                            : comment.usuario?.user_metadata?.avatar_url
                        }
                        alt={getDisplayName(comment)}
                      />
                      <AvatarFallback>
                        {getInitials(getDisplayName(comment))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">
                          {comment.usuario_id === currentUser?.id
                            ? currentUser?.user_metadata?.nome || "Admin"
                            : comment.usuario?.nome || "Admin"}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.criado_em)}
                        </span>
                      </div>
                      <div
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: comment.conteudo,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
