import React, { useState } from "react";
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

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const isOwner = discussion.user_id === currentUser?.id;

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
                discussion?.user_metadata?.avatar_url ||
                getAvatarUrl(discussion)
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
                  {discussion.user_metadata?.nome || "Usuário"}
                </p>
                <span className="text-sm text-muted-foreground">
                  {formatDate(discussion.created_at)}
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
                __html: discussion.content,
              }}
            />
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={() => onLike(discussion.id)}
                disabled={isLiking}
                className={`flex items-center space-x-1 ${
                  discussion.user_has_liked
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">
                  {discussion.likes_count || 0} Curtir
                </span>
              </button>
              <button
                onClick={() => onComment(discussion.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">
                  {discussion.comments_count || 0} Comentar
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
            {discussion.comments && discussion.comments.length > 0 && (
              <div className="mt-4 space-y-4">
                {discussion.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          comment?.user_metadata?.avatar_url ||
                          getAvatarUrl(comment)
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
                          {comment.user_metadata?.nome || "Usuário"}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <div
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: comment.content,
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
