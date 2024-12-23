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
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState(
    currentUser?.user_metadata?.avatar_style || AVATAR_STYLES[0].value
  );
  const [selectedSeed, setSelectedSeed] = useState(
    currentUser?.user_metadata?.avatar_seed || null
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (style, seed) => {
    try {
      setSelectedStyle(style);
      setSelectedSeed(seed);

      const avatarUrl = getAvatarUrl(currentUser, style, seed);

      // Atualiza o usuário no Auth
      const { data, error: userError } = await supabase.auth.updateUser({
        data: {
          avatar_style: style,
          avatar_seed: seed,
          avatar_url: avatarUrl,
        },
      });

      if (userError) throw userError;

      // Atualiza o avatar em todas as discussões do usuário
      const { error: discussionsError } = await supabase
        .from("discussions")
        .update({
          user_metadata: {
            ...currentUser.user_metadata,
            avatar_style: style,
            avatar_seed: seed,
            avatar_url: avatarUrl,
          },
        })
        .eq("user_id", currentUser.id);

      if (discussionsError) throw discussionsError;

      // Atualiza o avatar em todos os comentários do usuário
      const { error: commentsError } = await supabase
        .from("comments")
        .update({
          user_metadata: {
            ...currentUser.user_metadata,
            avatar_style: style,
            avatar_seed: seed,
            avatar_url: avatarUrl,
          },
        })
        .eq("user_id", currentUser.id);

      if (commentsError) throw commentsError;

      // Atualiza o currentUser localmente
      if (data.user) {
        currentUser.user_metadata = {
          ...currentUser.user_metadata,
          avatar_style: style,
          avatar_seed: seed,
          avatar_url: avatarUrl,
        };
      }

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
      refreshDiscussions();
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

      refreshDiscussions();
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
      refreshDiscussions();

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
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="flex">
        <CommunitySidebar />
        <main className="flex-1 p-6">
          <ScrollArea className="h-full">
            <div className="container mx-auto py-6 px-4 max-w-4xl">
              <div className="space-y-6">
                <div className="bg-card rounded-xl shadow-sm p-6 mb-8 border border-border">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <div className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10 ring-2 ring-white hover:ring-blue-400 transition-all cursor-pointer">
                            <img
                              src={
                                currentUser?.user_metadata?.avatar_url ||
                                getAvatarUrl(
                                  currentUser,
                                  currentUser?.user_metadata?.avatar_style,
                                  currentUser?.user_metadata?.avatar_seed
                                )
                              }
                              alt="Avatar"
                              className="aspect-square h-full w-full"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Escolha seu avatar</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Upload de Foto */}
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">
                                Foto Personalizada
                              </h3>
                              <div className="flex items-center gap-4">
                                {currentUser?.user_metadata?.avatar_style ===
                                  "custom" && (
                                  <div className="relative flex shrink-0 overflow-hidden rounded-full h-20 w-20 ring-2 ring-white">
                                    <img
                                      src={currentUser.user_metadata.avatar_url}
                                      alt="Avatar personalizado"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <label
                                    htmlFor="avatar-upload"
                                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full cursor-pointer ${
                                      isUploading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    {isUploading ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Carregando...</span>
                                      </div>
                                    ) : (
                                      "Fazer Upload"
                                    )}
                                    <input
                                      id="avatar-upload"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleAvatarUpload}
                                      disabled={isUploading}
                                      className="hidden"
                                    />
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG ou GIF. Máximo 5MB.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Seletor de Estilo */}
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">
                                Avatares Pré-definidos
                              </h3>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {AVATAR_STYLES.map((style) => (
                                  <button
                                    key={style.value}
                                    onClick={() =>
                                      setSelectedStyle(style.value)
                                    }
                                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                                      selectedStyle === style.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                    }`}
                                  >
                                    {style.label}
                                  </button>
                                ))}
                              </div>

                              {/* Grid de Avatares */}
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium">
                                  {
                                    AVATAR_STYLES.find(
                                      (s) => s.value === selectedStyle
                                    )?.label
                                  }
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                  {AVATAR_STYLES.find(
                                    (s) => s.value === selectedStyle
                                  )
                                    ?.seeds.slice(
                                      currentPage * 6,
                                      currentPage * 6 + 6
                                    )
                                    .map((seed) => (
                                      <button
                                        key={seed}
                                        onClick={() =>
                                          handleAvatarChange(
                                            selectedStyle,
                                            seed
                                          )
                                        }
                                        className={`relative flex shrink-0 overflow-hidden rounded-full h-20 w-20 transition-all mx-auto group
                                          ${
                                            selectedSeed === seed
                                              ? "ring-4 ring-primary"
                                              : "ring-2 ring-white hover:ring-blue-400"
                                          }`}
                                      >
                                        <img
                                          src={getAvatarUrl(
                                            currentUser,
                                            selectedStyle,
                                            seed
                                          )}
                                          alt={`Avatar ${selectedStyle} ${seed}`}
                                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                      </button>
                                    ))}
                                </div>

                                {/* Paginação Simplificada */}
                                {AVATAR_STYLES.find(
                                  (s) => s.value === selectedStyle
                                )?.seeds.length > 6 && (
                                  <div className="flex justify-center gap-1 mt-4">
                                    {Array.from({
                                      length: Math.ceil(
                                        AVATAR_STYLES.find(
                                          (s) => s.value === selectedStyle
                                        )?.seeds.length / 6
                                      ),
                                    }).map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={() => setCurrentPage(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                          currentPage === index
                                            ? "bg-primary w-4"
                                            : "bg-muted hover:bg-muted/80"
                                        }`}
                                        aria-label={`Página ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex-1">
                      <form onSubmit={handleQuickPost}>
                        <RichTextEditor
                          value={quickPost}
                          onChange={(value) => setQuickPost(value)}
                          placeholder="O que você está pensando?"
                        />
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="submit"
                            disabled={posting || !quickPost.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {posting ? "Publicando..." : "Publicar"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-border"
                  >
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
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-foreground">
                              {getDisplayName(discussion)}
                            </p>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(discussion.created_at)}
                            </span>
                          </div>
                          <div
                            className="mt-1 text-sm text-foreground break-words"
                            dangerouslySetInnerHTML={{
                              __html: discussion.content,
                            }}
                          />
                          <div className="mt-4 flex items-center space-x-4">
                            <button
                              onClick={() => handleLike(discussion.id)}
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
                              onClick={() => handleComment(discussion.id)}
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

                          {activeDiscussion === discussion.id &&
                            isCommenting && (
                              <div className="mt-4">
                                <RichTextEditor
                                  value={commentText}
                                  onChange={(value) => setCommentText(value)}
                                  placeholder="Escreva seu comentário..."
                                />
                                <div className="mt-2 flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setActiveDiscussion(null);
                                      setIsCommenting(false);
                                      setCommentText("");
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={() => submitComment(discussion.id)}
                                    disabled={!commentText.trim()}
                                  >
                                    Comentar
                                  </Button>
                                </div>
                              </div>
                            )}

                          {discussion.comments?.length > 0 && (
                            <div className="mt-4 space-y-4">
                              <Separator />
                              {discussion.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex space-x-3"
                                >
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
                                        {getDisplayName(comment)}
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
                ))}
              </div>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
