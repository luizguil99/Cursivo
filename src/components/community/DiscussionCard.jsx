import React, { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";

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
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [discussionUser, setDiscussionUser] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);

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
              },
            });
          }
        } catch (error) {
          console.error("Erro ao carregar usuário da discussão:", error);
        }
      }
    };

    loadDiscussionUser();
  }, [discussion.usuario_id, currentUser?.id]);

  const handleDelete = async () => {
    onDelete(discussion.id);
    setShowDeleteDialog(false);
  };

  const handleDeleteComment = async () => {
    try {
      const { error } = await supabase
        .from('comentarios_comunidade')
        .delete()
        .eq('id', commentToDelete);

      if (error) throw error;

      // Atualiza a lista de comentários localmente
      const updatedComments = discussion.comentarios.filter(
        (comment) => comment.id !== commentToDelete
      );
      discussion.comentarios = updatedComments;
      discussion.comentarios_count = updatedComments.length;

      setShowDeleteCommentDialog(false);
      setCommentToDelete(null);
      
      toast({
        title: "Comentário excluído com sucesso!",
        description: "O comentário foi removido.",
      });
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast({
        title: "Erro ao excluir comentário",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

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

  const MAX_VISIBLE_COMMENTS = 3;
  const hasMoreComments = discussion.comentarios?.length > MAX_VISIBLE_COMMENTS;
  const visibleComments = showAllComments 
    ? discussion.comentarios 
    : discussion.comentarios?.slice(0, MAX_VISIBLE_COMMENTS);

  return (
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-border">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10 ring-2 ring-yellow-100">
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
                    className="text-gray-500 hover:text-red-600 transition-colors"
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
              className="mt-3 text-sm text-foreground break-words prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: discussion.conteudo,
              }}
            />

            <div className="mt-4 flex items-center space-x-6">
              <button
                onClick={() => onLike(discussion.id)}
                disabled={isLiking}
                className={`flex items-center space-x-2 transition-colors ${
                  discussion.isLiked
                    ? "text-yellow-500"
                    : "text-gray-500 hover:text-yellow-500"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {discussion.curtidas || 0} Curtir
                </span>
              </button>
              <button
                onClick={() => onComment(discussion.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-yellow-500 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {discussion.comentarios_count || 0} Comentar
                </span>
              </button>
            </div>

            {activeDiscussion === discussion.id && isCommenting && (
              <div className="mt-4">
                <RichTextEditor
                  value={commentText}
                  onChange={(value) => setCommentText(value)}
                  placeholder="Escreva seu comentário..."
                  className="min-h-[100px] bg-gray-50/50"
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={onCancelComment}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => onSubmitComment(discussion.id)}
                    disabled={!commentText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Comentar
                  </Button>
                </div>
              </div>
            )}

            {Array.isArray(discussion.comentarios) && discussion.comentarios.length > 0 && (
              <div className="mt-4 space-y-4 pt-4 border-t border-border">
                {visibleComments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 ring-1 ring-yellow-100">
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
                      <div className="flex items-center justify-between">
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
                        {comment.usuario_id === currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-500 -mr-2"
                            onClick={() => {
                              setCommentToDelete(comment.id);
                              setShowDeleteCommentDialog(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div
                        className="text-sm text-gray-700 prose prose-sm"
                        dangerouslySetInnerHTML={{
                          __html: comment.conteudo,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {hasMoreComments && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                    onClick={() => setShowAllComments(!showAllComments)}
                  >
                    {showAllComments ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Mostrar menos comentários
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver mais {discussion.comentarios.length - MAX_VISIBLE_COMMENTS} comentários
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir comentário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteCommentDialog(false);
                setCommentToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleDeleteComment} variant="destructive">
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
