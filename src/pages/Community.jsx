import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import OnlineUsers from "@/components/community/OnlineUsers";
import DailyEvents from "@/components/community/DailyEvents";
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
  getDiscussions,
  toggleDiscussionLike,
  checkUserLike,
  addComment,
  deleteDiscussion,
} from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
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
  const [discussions, setDiscussions] = useState([]);
  const [isLiking, setIsLiking] = useState(false);
  const [quickPost, setQuickPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(
    currentUser?.user_metadata?.avatar_style || AVATAR_STYLES[0].value
  );
  const [selectedSeed, setSelectedSeed] = useState(
    currentUser?.user_metadata?.avatar_seed || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [userName, setUserName] = useState(
    currentUser?.user_metadata?.nome || "Usuário"
  );
  const ITEMS_PER_PAGE = 5;

  // Função para carregar as discussões
  const loadDiscussions = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      const from = (pageNumber - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("publicacao_comunidade")
        .select("*, comentarios:comentarios_comunidade(*)", { count: "exact" })
        .order("criado_em", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (pageNumber === 1) {
        setDiscussions(data);
      } else {
        setDiscussions((prev) => [...prev, ...data]);
      }

      setHasMore(count > pageNumber * ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Erro ao carregar discussões:", error);
      toast({
        title: "Erro ao carregar discussões",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleAvatarChange = async (style, seed) => {
    try {
      if (!currentUser) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para alterar seu avatar.",
          variant: "destructive",
        });
        return;
      }

      // Gerar URL do avatar
      const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

      // Atualizar o user_metadata no Auth e na tabela perfis em paralelo
      const [authResult, perfilUpdateResult] = await Promise.all([
        supabase.auth.updateUser({
          data: {
            avatar_url: avatarUrl,
            avatar_seed: seed,
            avatar_style: style,
          },
        }),
        supabase
          .from("perfis")
          .update({
            user_metadata: {
              avatar_url: avatarUrl,
              avatar_seed: seed,
              avatar_style: style,
            },
          })
          .eq("id", currentUser.id),
      ]);

      if (authResult.error) {
        console.error("Erro ao atualizar avatar no auth:", authResult.error);
        throw authResult.error;
      }

      if (perfilUpdateResult.error) {
        console.error(
          "Erro ao atualizar avatar no perfil:",
          perfilUpdateResult.error
        );
        throw perfilUpdateResult.error;
      }

      setSelectedStyle(style);
      setSelectedSeed(seed);
      setDialogOpen(false);

      toast({
        description: "Avatar atualizado com sucesso!",
      });

      // Forçar atualização das discussões para mostrar o novo avatar
      await loadDiscussions();
    } catch (error) {
      console.error("Erro detalhado ao atualizar avatar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu avatar.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      console.log("Iniciando upload de imagem:", {
        fileName: file.name,
        fileSize: file.size,
      });

      // Verificar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        console.log("Tipo de arquivo inválido:", file.type);
        toast({
          variant: "destructive",
          description: "Por favor, selecione uma imagem válida.",
        });
        return;
      }

      // Verificar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log("Arquivo muito grande:", file.size);
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
      console.log("Imagem enviada com sucesso:", imageUrl);

      // Atualizar avatar no auth
      const { data: authData, error: userError } =
        await supabase.auth.updateUser({
          data: {
            avatar_style: "custom",
            avatar_url: imageUrl,
          },
        });

      if (userError) throw userError;
      console.log("Auth atualizado com sucesso:", authData);

      // Atualizar na tabela de perfis
      const { error: profileError } = await supabase
        .from("perfis")
        .update({
          user_metadata: {
            ...currentUser.user_metadata,
            avatar_style: "custom",
            avatar_url: imageUrl,
          },
        })
        .eq("id", currentUser.id);

      if (profileError) throw profileError;
      console.log("Perfil atualizado com sucesso");

      // Atualizar estado local
      if (authData.user) {
        currentUser.user_metadata = {
          ...currentUser.user_metadata,
          avatar_style: "custom",
          avatar_url: imageUrl,
        };

        // Força atualização do estado para re-renderizar o componente
        const updatedUser = { ...currentUser };
        // setCurrentUser(updatedUser);
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
      console.log("Interface atualizada com sucesso");
      toast({
        description: "Avatar atualizado com sucesso!",
      });

      await loadDiscussions();
      console.log("Discussões atualizadas com sucesso");
    } catch (error) {
      console.error("Erro detalhado ao fazer upload do avatar:", error);
      toast({
        variant: "destructive",
        description: `Erro ao atualizar avatar: ${error.message}`,
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

    if (isLiking) return; // Previne múltiplos cliques
    setIsLiking(true);

    try {
      // Encontra a discussão atual
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) return;

      // Verifica o estado atual do like
      const isLiked = discussion.isLiked;

      // Calcula o novo número de curtidas
      const newLikes = isLiked
        ? Math.max(0, (discussion.curtidas || 0) - 1)
        : (discussion.curtidas || 0) + 1;

      // Atualiza o estado localmente primeiro (otimista)
      const updatedDiscussions = discussions.map((d) => {
        if (d.id === discussionId) {
          return {
            ...d,
            curtidas: newLikes,
            isLiked: !isLiked,
          };
        }
        return d;
      });

      // Atualiza o estado imediatamente para feedback visual
      setDiscussions(updatedDiscussions);

      // Faz a requisição ao servidor em background
      const result = await toggleDiscussionLike(discussionId, currentUser.id);

      if (!result) {
        // Se houver erro, reverte para o estado anterior
        setDiscussions(discussions);
        toast({
          variant: "destructive",
          description: "Erro ao processar sua ação.",
        });
      }
    } catch (error) {
      console.error("Erro ao curtir/descurtir:", error);
      // Reverte a atualização otimista em caso de erro
      setDiscussions(discussions);
      toast({
        variant: "destructive",
        description: "Erro ao processar sua ação.",
      });
    } finally {
      setIsLiking(false);
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

    setIsCommenting(true);

    try {
      // Encontra a discussão atual
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) return;

      // Cria um comentário temporário com os dados corretos do usuário
      const tempComment = {
        id: "temp-" + Date.now(),
        conteudo: commentText,
        criado_em: new Date().toISOString(),
        usuario_id: currentUser.id,
        usuario: {
          id: currentUser.id,
          nome: currentUser.user_metadata?.nome || "Admin",
          user_metadata: currentUser.user_metadata,
        },
      };

      // Atualiza o estado localmente primeiro (otimista)
      const updatedDiscussions = discussions.map((d) => {
        if (d.id === discussionId) {
          const currentComments = Array.isArray(d.comentarios)
            ? d.comentarios
            : [];
          return {
            ...d,
            comentarios: [...currentComments, tempComment],
            comentarios_count: currentComments.length + 1,
          };
        }
        return d;
      });

      // Atualiza o estado imediatamente
      setDiscussions(updatedDiscussions);

      // Limpa o campo de comentário e fecha o formulário
      setCommentText("");
      setActiveDiscussion(null);

      // Faz a requisição ao servidor em background
      const newComment = await addComment(
        discussionId,
        commentText,
        currentUser.id
      );

      if (!newComment) {
        throw new Error("Erro ao adicionar comentário no servidor");
      }

      // Atualiza o comentário com os dados reais do servidor
      setDiscussions((prevDiscussions) =>
        prevDiscussions.map((d) => {
          if (d.id === discussionId) {
            const updatedComments = Array.isArray(d.comentarios)
              ? d.comentarios.map((c) =>
                  c.id === tempComment.id ? newComment : c
                )
              : [newComment];

            return {
              ...d,
              comentarios: updatedComments,
              comentarios_count: updatedComments.length,
            };
          }
          return d;
        })
      );
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      // Reverte a atualização otimista em caso de erro
      setDiscussions(discussions);
      toast({
        variant: "destructive",
        description: "Erro ao adicionar comentário.",
      });
    } finally {
      setIsCommenting(false);
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
      await loadDiscussions();

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
      await loadDiscussions();
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

  const handleScroll = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    loadDiscussions(page);
  }, [page]);

  useEffect(() => {
    if (currentUser && !currentUser.user_metadata?.avatar_style) {
      const { style, seed } = generateRandomAvatar();
      handleAvatarChange(style, seed);
    }
  }, [currentUser]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p className="text-gray-600 text-center mb-4">
          Você precisa estar logado para acessar a comunidade.
        </p>
        <Link
          href="/login"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CommunitySidebar />
      <div className="flex-1 overflow-y-auto">
        <TopNav />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Feed Principal */}
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Post Form */}
              <div className="bg-card rounded-xl shadow-sm border border-yellow-500 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar
                    className="cursor-pointer"
                    onClick={() => setDialogOpen(true)}
                  >
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
                    <h3 className="font-medium text-foreground">{userName}</h3>
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

              {/* Lista de Discussões */}
              <div className="space-y-6">
                {discussions.map((discussion) => (
                  <div key={discussion.id}>
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

                {/* Loading Spinner */}
                {(isLoading || isLoadingMore) && (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                )}

                {/* Mensagem quando não há mais posts */}
                {!isLoading &&
                  !isLoadingMore &&
                  !hasMore &&
                  discussions.length > 0 && (
                    <div className="py-8 text-center">
                      <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        <span>Não há mais publicações para carregar</span>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Usuários Online */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-card rounded-xl shadow-sm overflow-hidden sticky top-6">
                <OnlineUsers />
              </div>
              <DailyEvents />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
