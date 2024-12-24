import React, { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  PlayCircle,
  Download,
  BookOpen,
  Brain,
  Trophy,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import FloatingChatButton from "./FloatingChatButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VimeoPlayer from "./VimeoPlayer";
import PandaVideo from "@/components/ui/panda-video";
import DailyEvents from "@/components/community/DailyEvents";
import {
  getNotificationsFromCache,
  setNotificationsCache,
  invalidateNotificationsCache,
} from "@/lib/notificationsCache";

function CourseContent({ lesson, onVideoEnd, updateSidebarCompletion }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [isChangingLesson, setIsChangingLesson] = useState(false);
  const [notifications, setNotifications] = useState(
    () => getNotificationsFromCache() || []
  );

  // Buscar notificações do Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      // Verificar cache
      const cachedData = getNotificationsFromCache();
      if (cachedData) {
        setNotifications(cachedData);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("notificacoes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;

        // Atualizar cache global
        setNotificationsCache(data || []);
        setNotifications(data || []);
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    };

    fetchNotifications();

    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel("notificacoes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
        },
        () => {
          // Força atualização do cache quando receber nova notificação
          invalidateNotificationsCache();
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para formatar o tempo relativo
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Agora mesmo";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Há ${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Há ${days} ${days === 1 ? "dia" : "dias"}`;
    }
  };

  // Debug do usuário
  useEffect(() => {
    console.log("=== DEBUG DO USUÁRIO ===");
    console.log("currentUser:", currentUser);
    if (currentUser) {
      console.log("ID:", currentUser.id);
      console.log("Email:", currentUser.email);
    } else {
      console.log("Nenhum usuário logado");
    }
    console.log("=====================");
  }, [currentUser]);

  // Efeito para limpar o estado quando a aula muda
  useEffect(() => {
    if (lesson?.id !== currentVideoId) {
      setIsLoading(true);
      setCurrentVideoId(lesson?.id);
    }
  }, [lesson?.id, currentVideoId]);

  // Verifica se a aula já foi concluída
  useEffect(() => {
    const checkLessonCompletion = async () => {
      if (!currentUser?.id || !lesson?.id) return;

      try {
        const { data, error } = await supabase
          .from("aulas_concluidas")
          .select("concluido_em")
          .eq("usuario_id", currentUser.id)
          .eq("videoaula_id", lesson.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao verificar conclusão:", error);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar conclusão:", error);
      }
    };

    if (currentVideoId === lesson?.id) {
      checkLessonCompletion();
    }
  }, [currentUser?.id, lesson?.id, currentVideoId]);

  // Função para lidar com o fim do vídeo
  const handleVideoEnd = useCallback(async () => {
    if (!currentUser?.id || !lesson?.id) {
      console.log("Usuário não logado ou aula não encontrada");
      return;
    }

    // Ativar loading
    setIsChangingLesson(true);

    // Atualizar a bolinha na sidebar imediatamente
    if (updateSidebarCompletion) {
      updateSidebarCompletion(lesson.id, true);
    }

    // Chamar onVideoEnd imediatamente para uma experiência mais responsiva
    if (onVideoEnd) onVideoEnd();

    try {
      // Primeiro, verifica se já existe um registro
      const { data: existingData, error: checkError } = await supabase
        .from("aulas_concluidas")
        .select("*")
        .eq("usuario_id", currentUser.id)
        .eq("videoaula_id", lesson.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Erro ao verificar aula concluída:", checkError);
        return;
      }

      // Se já existe um registro, não precisa fazer nada
      if (existingData) {
        console.log("Aula já foi concluída anteriormente");
        return;
      }

      // Se não existe, insere um novo registro
      console.log("Salvando nova conclusão de aula");
      const { error: insertError } = await supabase
        .from("aulas_concluidas")
        .insert({
          usuario_id: currentUser.id,
          videoaula_id: lesson.id,
          concluido_em: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Erro ao salvar progresso:", insertError);
        return;
      }

      console.log("Progresso salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    }
  }, [currentUser?.id, lesson?.id, onVideoEnd, updateSidebarCompletion]);

  // Desativar loading quando mudar de aula
  useEffect(() => {
    setIsChangingLesson(false);
  }, [lesson?.id]);

  // Função para converter URLs de vídeo em URLs de embed
  const getVideoEmbedUrl = (url) => {
    if (!url) return "";

    // Parâmetros do Vimeo para remover todos os controles
    const vimeoParams = [
      "title=0",
      "byline=0",
      "portrait=0",
      "sidedock=0",
      "controls=1",
      "background=0",
      "share=0",
      "like=0",
      "watch_later=0",
      "playsinline=1",
      "transparent=0",
      "autopause=0",
      "dnt=1",
    ].join("&");

    // Se já for uma URL de embed do Vimeo
    if (url.includes("player.vimeo.com")) {
      const hasParams = url.includes("?");
      const connector = hasParams ? "&" : "?";
      return `${url}${connector}${vimeoParams}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?${vimeoParams}`;
    }

    // YouTube
    const youtubeMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/))([^&?]+)/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    return url;
  };

  // Verificar se é um vídeo do Vimeo e extrair o ID
  const getVimeoId = (url) => {
    if (!url) return null;
    // Tentar extrair ID de URL normal do Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return vimeoMatch[1];

    // Tentar extrair ID de URL de embed do Vimeo
    const vimeoEmbedMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (vimeoEmbedMatch) return vimeoEmbedMatch[1];

    return null;
  };

  const isVimeoVideo = lesson?.videoUrl?.includes("vimeo.com");
  const vimeoId = isVimeoVideo ? getVimeoId(lesson.videoUrl) : null;
  const videoUrl = lesson?.videoUrl;
  // Se não houver lição ou se showExplore for true, mostra a página de exploração
  if (!lesson || location.state?.showExplore) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Coluna Principal */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              <div className="rounded-lg p-4 sm:p-6 border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-2 text-[#F3C92C]">
                      Bem-vindo de volta!
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Continue sua jornada de aprendizado
                    </p>
                  </div>
                  <div className="sm:block">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs sm:text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                      Nível Atual: Intermediário
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  {/* Card 2 - Primeira coluna, primeira linha */}
                  <div className="group rounded-lg p-3 sm:p-4 border bg-card hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Exercícios Concluídos
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-lg sm:text-2xl font-bold">28</p>
                          <span className="text-xs text-green-500 truncate">
                            +5 hoje
                          </span>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors ml-2">
                        <Brain
                          className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 4 - Segunda coluna, primeira linha */}
                  <div className="group rounded-lg p-3 sm:p-4 border bg-card hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Conquistas
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-lg sm:text-2xl font-bold">5</p>
                          <span className="text-xs text-green-500 truncate">
                            Nova!
                          </span>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors ml-2">
                        <Trophy
                          className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 1 - Primeira coluna, segunda linha */}
                  <div className="group rounded-lg p-3 sm:p-4 border bg-card hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Cursos em Andamento
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-lg sm:text-2xl font-bold">4</p>
                          <span className="text-xs text-green-500 truncate">
                            +2 nesta semana
                          </span>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors ml-2">
                        <BookOpen
                          className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Card 3 - Segunda coluna, segunda linha */}
                  <div className="group rounded-lg p-3 sm:p-4 border bg-card hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Horas Estudadas
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-lg sm:text-2xl font-bold">12h</p>
                          <span className="text-xs text-green-500 truncate">
                            +3h hoje
                          </span>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors ml-2">
                        <Clock
                          className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Último Curso */}
                <div className="rounded-lg p-4 sm:p-6 mb-6 border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Continue Estudando
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full w-fit">
                      Última atividade
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#F3C92C] rounded-lg flex items-center justify-center shadow-lg shadow-[#F3C92C]/20 flex-shrink-0">
                      <BookOpen
                        className="h-7 w-7 sm:h-8 sm:w-8 text-background"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm sm:text-base">
                          História Medieval
                        </h4>
                        <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
                          Módulo 2
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        Sociedade Feudal
                      </p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-[#F3C92C] h-2 rounded-full transition-all"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        60% concluído • 2 aulas restantes
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate("/course/1/lesson/5")}
                      className="bg-[#F3C92C] hover:bg-[#F3C92C]/80 text-background shadow-lg shadow-[#F3C92C]/20 w-full sm:w-auto"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
                {/* Próximas Atividades */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Próximas Atividades
                    </h3>
                    <button
                      type="button"
                      className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Ver todas
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300">
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <BookOpen
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm sm:text-base">
                            Aula de Geografia
                          </p>
                          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                            Novo
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Clima e Vegetação
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto mt-2 sm:mt-0"
                      >
                        Iniciar
                      </Button>
                    </div>

                    <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300">
                      <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Brain
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm sm:text-base">
                            Exercício de Matemática
                          </p>
                          <span className="px-2 py-0.5 text-xs border border-primary/20 text-primary rounded-full">
                            10 questões
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Álgebra Linear
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto mt-2 sm:mt-0"
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Cards Inferiores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="group p-4 rounded-lg border bg-card text-card-foreground hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-lg w-fit group-hover:bg-primary/20 transition-colors mb-3">
                    <BookOpen
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1">
                    Material Completo
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Videoaulas, textos e exercícios para fixação
                  </p>
                </div>

                <div className="group p-4 rounded-lg border bg-card text-card-foreground hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-lg w-fit group-hover:bg-primary/20 transition-colors mb-3">
                    <Brain
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1">
                    Exercícios Práticos
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Questões e simulados para testar seu conhecimento
                  </p>
                </div>

                <div className="group p-4 rounded-lg border bg-card text-card-foreground hover:border-primary/50 transition-all duration-300">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-lg w-fit group-hover:bg-primary/20 transition-colors mb-3">
                    <Trophy
                      className="h-5 w-5 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base mb-1">
                    Acompanhamento
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Monitore seu progresso em cada matéria
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna de Notificações */}
            <div className="w-full lg:w-80 lg:flex lg:flex-col lg:gap-4">
              {/* Notificações */}
              <div className="rounded-lg p-4 sm:p-6 border bg-card text-card-foreground">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-semibold">
                    Notificações
                  </h2>
                  <span className="px-2 py-1 text-xs font-medium bg-[#F3C92C] text-background rounded-full">
                    {notifications.length}{" "}
                    {notifications.length === 1 ? "nova" : "novas"}
                  </span>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="group border-l-2 border-[#F3C92C] pl-3 sm:pl-4 py-2 hover:bg-primary/5 rounded-r-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        {notification.grade ? (
                          <span className="px-2 py-0.5 text-xs border border-primary/20 text-primary rounded-full">
                            Nota: {notification.grade}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                            {notification.type || "Novo"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eventos */}
              <DailyEvents noMargin />
            </div>
          </div>
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 h-full">
      {/* Conteúdo Principal */}
      <div className="lg:col-span-9 2xl:col-span-10 h-full overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 md:px-6 lg:px-8">
          <div className="lg:col-start-2 lg:col-span-10 xl:col-start-3 xl:col-span-8 p-4 md:p-6 space-y-4 md:space-y-6">
            <h1 className="text-xl md:text-2xl font-bold">{lesson.title}</h1>

            <div
              className="relative rounded-lg overflow-hidden bg-black w-full max-w-4xl mx-auto"
              style={{ boxShadow: "0 4px 20px rgba(243, 201, 44, 0.2)" }}
            >
              <div className="aspect-video relative">
                {isVimeoVideo && vimeoId ? (
                  <VimeoPlayer
                    videoId={vimeoId}
                    onVideoEnd={() => handleVideoEnd()}
                    lessonId={lesson.id}
                  />
                ) : (
                  <PandaVideo
                    videoUrl={videoUrl}
                    onVideoEnd={() => handleVideoEnd()}
                    width="100%"
                    height="100%"
                  />
                )}
                {isChangingLesson && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-2 text-white">
                      <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      <span>Próxima aula</span>
                      <ArrowRight className="w-4 h-4 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line">
                {lesson.description}
              </p>
            </div>

            {Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-semibold">
                  Material Complementar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-full">
                  {lesson.resources.map((resource) => (
                    <Button
                      key={`${resource.name}-${resource.url}`}
                      variant="outline"
                      className="w-full justify-start h-10 md:h-12"
                      onClick={() => window.open(resource.url, "_blank")}
                    >
                      <Download
                        className="mr-2 h-3 w-3 md:h-4 md:w-4"
                        aria-hidden="true"
                      />
                      <span className="text-xs md:text-sm">
                        {resource.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {lesson.nextLesson && (
              <div className="pt-4">
                <Button
                  className="w-full sm:w-auto flex items-center gap-2"
                  style={{
                    background:
                      "linear-gradient(90deg, #B4902A -158.27%, #F3C92C 108.81%)",
                    border: "none",
                  }}
                  onClick={() => lesson.onNextLesson()}
                >
                  <PlayCircle
                    className="h-3 w-3 md:h-4 md:w-4"
                    aria-hidden="true"
                  />
                  <span className="text-xs md:text-sm">Próxima Aula</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}

export default CourseContent;
