import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/contexts/AccessContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  createDiscussion,
  supabase,
  toggleDiscussionLike,
  addComment,
  deleteDiscussion,
} from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "@/components/community/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadImage } from "@/lib/s3";
import { getAvatarUrl, getInitials, getDisplayName } from "@/utils/avatar";
import DiscussionCard from "@/components/community/DiscussionCard";

const AVATAR_STYLES = [
  {
    value: "adventurer",
    label: "Aventureiro",
    seeds: ["Felix", "Luna", "Max", "Nova", "Leo", "Zoe", "Kai", "Mia"],
  },
  {
    value: "avataaars",
    label: "Cartoon",
    seeds: [
      "Toon1",
      "Toon2",
      "Toon3",
      "Toon4",
      "Toon5",
      "Toon6",
      "Toon7",
      "Toon8",
    ],
  },
  {
    value: "bottts",
    label: "Robô",
    seeds: ["Bot1", "Bot2", "Bot3", "Bot4", "Bot5", "Bot6", "Bot7", "Bot8"],
  },
  {
    value: "micah",
    label: "Micah",
    seeds: [
      "Micah1",
      "Micah2",
      "Micah3",
      "Micah4",
      "Micah5",
      "Micah6",
      "Micah7",
      "Micah8",
    ],
  },
];

export default function Community() {
  const { currentUser } = useAuth();
  const { loading: accessLoading, hasAccess } = useAccess();
  const {
    discussions,
    loading: discussionsLoading,
    refreshDiscussions,
    setDiscussions,
  } = useCommunity();
  const [quickPost, setQuickPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [selectedStyle, setSelectedStyle] = useState(
    currentUser?.user_metadata?.avatar_style || AVATAR_STYLES[0].value
  );
  const [selectedSeed, setSelectedSeed] = useState(
    currentUser?.user_metadata?.avatar_seed || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        const { data: perfil, error } = await supabase
          .from("perfis")
          .select("nome")
          .eq("id", currentUser.id)
          .single();

        if (!error && perfil) {
          setUserName(perfil.nome);
        }
      }
    };

    fetchUserName();
  }, [currentUser]);

  const handleAvatarChange = async (style, seed) => {
    try {
      setSelectedStyle(style);
      setSelectedSeed(seed);

      const { avatarUrl } = await updateUserAvatar(currentUser.id, style, seed);

      // Atualiza o currentUser localmente
      currentUser.user_metadata = {
        ...currentUser.user_metadata,
        avatar_style: style,
        avatar_seed: seed,
        avatar_url: avatarUrl,
      };

      // Atualiza as discussões na interface
      setDiscussions(
        discussions.map((discussion) => {
          if (discussion.user_id === currentUser.id) {
            return {
              ...discussion,
              user_metadata: {
                ...discussion.user_metadata,
                avatar_style: style,
                avatar_seed: seed,
                avatar_url: avatarUrl,
              },
            };
          }
          // Atualiza os comentários dentro da discussão
          if (discussion.comments) {
            discussion.comments = discussion.comments.map((comment) => {
              if (comment.user_id === currentUser.id) {
                return {
                  ...comment,
                  user_metadata: {
                    ...comment.user_metadata,
                    avatar_style: style,
                    avatar_seed: seed,
                    avatar_url: avatarUrl,
                  },
                };
              }
              return comment;
            });
          }
          return discussion;
        })
      );

      setDialogOpen(false);
      toast({
        description: "Avatar atualizado com sucesso!",
      });

      // Atualiza a lista de discussões
      refreshDiscussions(currentUser.id);
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast({
        variant: "destructive",
        description: "Erro ao atualizar avatar.",
      });
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Verificar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          description: "Por favor, selecione uma imagem válida.",
        });
        return;
      }

      // Verificar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          description: "A imagem deve ter no máximo 5MB.",
        });
        return;
      }

      setIsUploading(true);

      // Mostrar loading
      toast({
        description: "Fazendo upload da imagem...",
      });

      // Fazer upload
      const imageUrl = await uploadImage(file);

      // Atualizar avatar
      const { data, error: userError } = await supabase.auth.updateUser({
        data: {
          avatar_style: "custom",
          avatar_url: imageUrl,
        },
      });

      if (userError) throw userError;

      // Atualizar discussões e comentários
      const { error: discussionsError } = await supabase
        .from("discussions")
        .update({
          user_metadata: {
            ...currentUser.user_metadata,
            avatar_style: "custom",
            avatar_url: imageUrl,
          },
        })
        .eq("user_id", currentUser.id);

      if (discussionsError) throw discussionsError;

      const { error: commentsError } = await supabase
        .from("comments")
        .update({
          user_metadata: {
            ...currentUser.user_metadata,
            avatar_style: "custom",
            avatar_url: imageUrl,
          },
        })
        .eq("user_id", currentUser.id);

      if (commentsError) throw commentsError;

      // Atualizar estado local
      if (data.user) {
        currentUser.user_metadata = {
          ...currentUser.user_metadata,
          avatar_style: "custom",
          avatar_url: imageUrl,
        };
      }

      // Atualizar interface
      setDiscussions(
        discussions.map((discussion) => {
          if (discussion.user_id === currentUser.id) {
            return {
              ...discussion,
              user_metadata: {
                ...discussion.user_metadata,
                avatar_style: "custom",
                avatar_url: imageUrl,
              },
            };
          }
          if (discussion.comments) {
            discussion.comments = discussion.comments.map((comment) => {
              if (comment.user_id === currentUser.id) {
                return {
                  ...comment,
                  user_metadata: {
                    ...comment.user_metadata,
                    avatar_style: "custom",
                    avatar_url: imageUrl,
                  },
                };
              }
              return comment;
            });
          }
          return discussion;
        })
      );

      setDialogOpen(false);
      toast({
        description: "Avatar atualizado com sucesso!",
      });

      refreshDiscussions(currentUser.id);
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast({
        variant: "destructive",
        description: "Erro ao atualizar avatar.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (discussionId) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        description: "Você precisa estar logado para curtir uma publicação.",
      });
      return;
    }

    // Encontra a discussão atual
    const discussion = discussions.find((d) => d.id === discussionId);
    if (!discussion) return;

    // Atualiza o estado localmente primeiro (otimista)
    const updatedDiscussions = discussions.map((d) => {
      if (d.id === discussionId) {
        return {
          ...d,
          likes_count: d.user_has_liked ? d.likes_count - 1 : d.likes_count + 1,
          user_has_liked: !d.user_has_liked,
        };
      }
      return d;
    });

    // Atualiza o estado imediatamente
    setDiscussions(updatedDiscussions);

    try {
      // Faz a requisição ao servidor em background
      await toggleDiscussionLike(discussionId, currentUser.id);
    } catch (error) {
      console.error("Erro ao curtir/descurtir:", error);
      // Reverte a atualização otimista em caso de erro
      setDiscussions(discussions);
      toast({
        variant: "destructive",
        description: "Erro ao processar sua ação.",
      });
    }
  };

  const handleComment = async (discussionId) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        description: "Você precisa estar logado para comentar.",
      });
      return;
    }

    setActiveDiscussion(discussionId);
    setIsCommenting(true);
  };

  const submitComment = async (discussionId) => {
    if (!commentText.trim()) return;

    // Encontra a discussão atual
    const discussion = discussions.find((d) => d.id === discussionId);
    if (!discussion) return;

    // Cria um comentário temporário
    const tempComment = {
      id: "temp-" + Date.now(),
      content: commentText,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      user_metadata: currentUser.user_metadata,
    };

    // Atualiza o estado localmente primeiro (otimista)
    const updatedDiscussions = discussions.map((d) => {
      if (d.id === discussionId) {
        return {
          ...d,
          comments: [...(d.comments || []), tempComment],
          comments_count: (d.comments_count || 0) + 1,
        };
      }
      return d;
    });

    // Atualiza o estado imediatamente
    setDiscussions(updatedDiscussions);

    // Limpa o campo de comentário
    setCommentText("");
    setActiveDiscussion(null);
    setIsCommenting(false);

    try {
      // Faz a requisição ao servidor em background
      await addComment(discussionId, commentText, currentUser.id);
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      // Reverte a atualização otimista em caso de erro
      setDiscussions(discussions);
      toast({
        variant: "destructive",
        description: "Erro ao adicionar comentário.",
      });
    }
  };

  const handleQuickPost = async (e) => {
    e.preventDefault();
    if (!quickPost.trim()) return;

    setPosting(true);
    try {
      // Cria a discussão
      await createDiscussion(
        "Nova publicação", // title
        quickPost, // content
        currentUser.id // userId
      );

      // Limpa o input e atualiza a lista
      setQuickPost("");
      const editor = document.querySelector(".tiptap");
      if (editor) {
        editor.innerHTML = "";
      }
      refreshDiscussions(currentUser.id);

      toast({
        description: "Publicação criada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar publicação:", error);
      toast({
        variant: "destructive",
        description: "Erro ao criar publicação.",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (discussionId) => {
    try {
      await deleteDiscussion(discussionId, currentUser.id);
      toast({
        title: "Publicação excluída",
        description: "Sua publicação foi excluída com sucesso.",
      });
      refreshDiscussions(currentUser.id);
    } catch (error) {
      console.error("Erro ao excluir publicação:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a publicação.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const generateRandomAvatar = () => {
    const style =
      AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const seed = style.seeds[Math.floor(Math.random() * style.seeds.length)];
    return { style: style.value, seed };
  };

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && !discussionsLoading && visiblePosts < discussions.length) {
      setVisiblePosts((prev) => prev + 5);
    }
  };

  useEffect(() => {
    if (currentUser && !currentUser.user_metadata?.avatar_style) {
      const { style, seed } = generateRandomAvatar();
      handleAvatarChange(style, seed);
    }
  }, [currentUser]);

  if (accessLoading || discussionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CommunitySidebar />
      <div className="flex-1">
        <TopNav />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Quick Post Form */}
          <div className="bg-card rounded-xl shadow-sm border border-yellow-500 p-6 mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar>
                <AvatarImage
                  src={
                    currentUser?.user_metadata?.avatar_url ||
                    getAvatarUrl(
                      currentUser,
                      currentUser?.user_metadata?.avatar_style,
                      currentUser?.user_metadata?.avatar_seed
                    )
                  }
                  alt="Avatar"
                />
                <AvatarFallback>
                  {getInitials(getDisplayName(currentUser))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  {userName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Compartilhe seus pensamentos com a comunidade
                </p>
              </div>
            </div>
            <RichTextEditor
              content={quickPost}
              onChange={setQuickPost}
              placeholder="O que você está pensando?"
              className="min-h-[120px]"
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleQuickPost}
                disabled={posting || !quickPost.trim()}
                className="bg-yellow-500 text-white px-6"
              >
                {posting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publicando...</span>
                  </div>
                ) : (
                  "Publicar"
                )}
              </Button>
            </div>
          </div>

          {/* Discussions List */}
          <ScrollArea
            className="h-[calc(100vh-16rem)]"
            onScrollCapture={handleScroll}
          >
            <div className="space-y-6 pr-4">
              {discussions.slice(0, visiblePosts).map((discussion) => (
                <div
                  key={discussion.id}
                  className="bg-card rounded-xl shadow-sm border border-yellow-500"
                >
                  <DiscussionCard
                    discussion={discussion}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDelete}
                    isLiking={isLiking}
                    isCommenting={isCommenting}
                    activeDiscussion={activeDiscussion}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    onCancelComment={() => {
                      setActiveDiscussion(null);
                      setIsCommenting(false);
                      setCommentText("");
                    }}
                    onSubmitComment={submitComment}
                  />
                </div>
              ))}

              {/* Loading States */}
              {visiblePosts < discussions.length && (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center space-x-2 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <span>Carregando mais publicações...</span>
                  </div>
                </div>
              )}
              {visiblePosts >= discussions.length && discussions.length > 0 && (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                    <span>Não há mais publicações para carregar</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
