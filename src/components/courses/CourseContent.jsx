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
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementsModal } from "@/components/achievements/AchievementsModal";
import { ContinueStudying } from "./ContinueStudying";
import { NextActivities } from "./NextActivities";

function CourseContent() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { unlockedAchievements, showModal, currentAchievement, setShowModal } =
    useAchievements(currentUser?.id);
  const [showAchievements, setShowAchievements] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [isChangingLesson, setIsChangingLesson] = useState(false);
  const [notifications, setNotifications] = useState(
    () => getNotificationsFromCache() || []
  );
  const [completedLessons, setCompletedLessons] = useState([]);
  const [todayLessons, setTodayLessons] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [todayQuestions, setTodayQuestions] = useState(0);
  const [horasEstudadas, setHorasEstudadas] = useState("0h");
  const [tempoHoje, setTempoHoje] = useState("0h");
  const [ultimaAulaVista, setUltimaAulaVista] = useState(null);
  const [progressoCurso, setProgressoCurso] = useState({
    porcentagem: 0,
    aulasRestantes: 0,
  });
  const [proximaAula, setProximaAula] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchCompletedItems = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Buscar todas as aulas concluídas
      const { data: allLessons, error: allError } = await supabase
        .from("aulas_concluidas")
        .select("videoaula_id")
        .eq("usuario_id", currentUser.id);

      if (allError) throw allError;
      setCompletedLessons(allLessons.map((item) => item.videoaula_id));

      // Buscar aulas concluídas hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayData, error: todayError } = await supabase
        .from("aulas_concluidas")
        .select("videoaula_id, concluido_em")
        .eq("usuario_id", currentUser.id)
        .gte("concluido_em", today.toISOString())
        .lt("concluido_em", tomorrow.toISOString());

      if (todayError) throw todayError;
      setTodayLessons(todayData.length);

      // Buscar total de questões concluídas
      const { data: allQuestions, error: questionsError } = await supabase
        .from("questoes_concluidas")
        .select("id")
        .eq("usuario_id", currentUser.id);

      if (questionsError) throw questionsError;
      setCompletedQuestions(allQuestions.length);

      // Buscar questões concluídas hoje
      const { data: todayQuestions, error: todayQuestionsError } =
        await supabase
          .from("questoes_concluidas")
          .select("id")
          .eq("usuario_id", currentUser.id)
          .gte("concluido_em", today.toISOString())
          .lt("concluido_em", tomorrow.toISOString());

      if (todayQuestionsError) throw todayQuestionsError;
      setTodayQuestions(todayQuestions.length);
    } catch (error) {
      console.error("Erro ao buscar itens concluídos:", error);
    }
  }, [currentUser]);

  // Buscar aulas e questões concluídas do Supabase
  useEffect(() => {
    fetchCompletedItems();
  }, [fetchCompletedItems]);

  // Escutar o evento de questão concluída
  useEffect(() => {
    const handleQuestionCompleted = () => {
      fetchCompletedItems();
    };

    window.addEventListener("questionCompleted", handleQuestionCompleted);

    return () => {
      window.removeEventListener("questionCompleted", handleQuestionCompleted);
    };
  }, [fetchCompletedItems]);

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
    if (currentLesson?.id !== currentVideoId) {
      setIsLoading(true);
      setCurrentVideoId(currentLesson?.id);
    }
  }, [currentLesson?.id, currentVideoId]);

  // Verifica se a aula já foi concluída
  useEffect(() => {
    const checkLessonCompletion = async () => {
      if (!currentUser?.id || !currentLesson?.id) return;

      try {
        const { data, error } = await supabase
          .from("aulas_concluidas")
          .select("concluido_em")
          .eq("usuario_id", currentUser.id)
          .eq("videoaula_id", currentLesson.id)
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

    if (currentVideoId === currentLesson?.id) {
      checkLessonCompletion();
    }
  }, [currentUser?.id, currentLesson?.id, currentVideoId]);

  // Função para lidar com o fim do vídeo
  const handleVideoEnd = useCallback(async () => {
    if (!currentUser?.id || !currentLesson?.id) return;

    try {
      // Ativar loading de transição
      setIsChangingLesson(true);

      // Disparar evento de aula concluída
      window.dispatchEvent(new CustomEvent("lessonCompleted"));

      // Atualizar a barra lateral se necessário
      if (location.state?.updateSidebarCompletion) {
        location.state.updateSidebarCompletion();
      }

      // Chamar callback de vídeo finalizado se existir
      if (location.state?.onVideoEnd) {
        location.state.onVideoEnd();
      }
    } catch (error) {
      console.error("Erro ao marcar aula como concluída:", error);
    }
  }, [currentUser?.id, currentLesson?.id, location.state]);

  // Desativar loading quando mudar de aula
  useEffect(() => {
    setIsChangingLesson(false);
  }, [currentLesson?.id]);

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

  const isVimeoVideo = currentLesson?.videoUrl?.includes("vimeo.com");
  const vimeoId = isVimeoVideo ? getVimeoId(currentLesson.videoUrl) : null;
  const videoUrl = currentLesson?.videoUrl;

  // Função para formatar o tempo total
  const formatarTempoEstudado = (totalSegundos) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h`;
    } else if (minutos > 0) {
      return `${minutos} min`;
    }
    return "0h";
  };

  // Função para buscar o total de horas estudadas
  const fetchTotalHorasEstudadas = async () => {
    try {
      // Busca todas as aulas concluídas
      const { data, error } = await supabase
        .from("aulas_concluidas")
        .select("tempo_assistido, concluido_em")
        .eq("usuario_id", currentUser?.id);

      if (error) throw error;

      // Pega a data de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Separa os tempos de hoje e total
      const { tempoHoje, tempoTotal } = data.reduce(
        (acc, aula) => {
          const tempoAssistido = aula.tempo_assistido || 0;
          const dataConclusao = new Date(aula.concluido_em);
          dataConclusao.setHours(0, 0, 0, 0);

          // Se foi concluído hoje, soma ao tempo de hoje
          if (dataConclusao.getTime() === hoje.getTime()) {
            acc.tempoHoje += tempoAssistido;
          }

          // Soma ao tempo total
          acc.tempoTotal += tempoAssistido;

          return acc;
        },
        { tempoHoje: 0, tempoTotal: 0 }
      );

      return {
        total: formatarTempoEstudado(tempoTotal),
        hoje: formatarTempoEstudado(tempoHoje),
      };
    } catch (error) {
      console.error("Erro ao buscar horas estudadas:", error);
      return { total: "0h", hoje: "0h" };
    }
  };

  // Atualiza as horas estudadas quando o usuário mudar
  useEffect(() => {
    if (currentUser?.id) {
      fetchTotalHorasEstudadas().then((tempos) => {
        setHorasEstudadas(tempos.total);
        setTempoHoje(tempos.hoje);
      });
    }
  }, [currentUser?.id]);

  // Atualiza as horas quando uma aula for concluída
  useEffect(() => {
    const handleLessonCompleted = () => {
      if (currentUser?.id) {
        fetchTotalHorasEstudadas().then((tempos) => {
          setHorasEstudadas(tempos.total);
          setTempoHoje(tempos.hoje);
        });
      }
    };

    window.addEventListener("lessonCompleted", handleLessonCompleted);
    return () =>
      window.removeEventListener("lessonCompleted", handleLessonCompleted);
  }, [currentUser?.id]);

  // Buscar última aula vista
  const fetchUltimaAulaVista = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from("aulas_concluidas")
        .select(
          `
          videoaula_id,
          concluido_em,
          videoaulas (
            id,
            titulo,
            modulo_id,
            modulos (
              titulo,
              curso_id,
              cursos (
                titulo
              )
            )
          )
        `
        )
        .eq("usuario_id", currentUser.id)
        .order("concluido_em", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setUltimaAulaVista(data[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar última aula vista:", error);
    }
  };

  // Buscar última aula vista quando o usuário mudar
  useEffect(() => {
    fetchUltimaAulaVista();
  }, [currentUser?.id]);

  // Atualizar última aula quando uma aula for concluída
  useEffect(() => {
    const handleLessonCompleted = () => {
      fetchUltimaAulaVista();
    };

    window.addEventListener("lessonCompleted", handleLessonCompleted);
    return () =>
      window.removeEventListener("lessonCompleted", handleLessonCompleted);
  }, []);

  // Função para calcular o progresso do curso
  const calcularProgressoCurso = async (cursoId) => {
    if (!currentUser?.id || !cursoId) return;

    try {
      // Buscar total de aulas do curso
      const { data: totalAulas, error: errorTotal } = await supabase
        .from("videoaulas")
        .select("id, modulo_id, modulos!inner (curso_id)")
        .eq("modulos.curso_id", cursoId);

      if (errorTotal) throw errorTotal;

      // Buscar aulas concluídas do usuário neste curso
      const { data: aulasCompletas, error: errorCompletas } = await supabase
        .from("aulas_concluidas")
        .select(
          "videoaula_id, videoaulas!inner(modulo_id, modulos!inner(curso_id))"
        )
        .eq("usuario_id", currentUser.id)
        .eq("videoaulas.modulos.curso_id", cursoId);

      if (errorCompletas) throw errorCompletas;

      // Calcular progresso
      const total = totalAulas?.length || 0;
      const completas = aulasCompletas?.length || 0;
      const restantes = total - completas;
      const porcentagem = total > 0 ? Math.round((completas / total) * 100) : 0;

      setProgressoCurso({
        porcentagem,
        aulasRestantes: restantes,
      });
    } catch (error) {
      console.error("Erro ao calcular progresso:", error);
      setProgressoCurso({ porcentagem: 0, aulasRestantes: 0 });
    }
  };

  // Atualizar progresso quando o curso mudar
  useEffect(() => {
    if (ultimaAulaVista?.videoaulas?.modulos?.curso_id) {
      calcularProgressoCurso(ultimaAulaVista.videoaulas.modulos.curso_id);
    }
  }, [ultimaAulaVista, currentUser?.id]);

  // Atualizar progresso quando uma aula for concluída
  useEffect(() => {
    const handleLessonCompleted = () => {
      if (ultimaAulaVista?.videoaulas?.modulos?.curso_id) {
        calcularProgressoCurso(ultimaAulaVista.videoaulas.modulos.curso_id);
      }
    };

    window.addEventListener("lessonCompleted", handleLessonCompleted);
    return () =>
      window.removeEventListener("lessonCompleted", handleLessonCompleted);
  }, [ultimaAulaVista]);

  // Função para buscar a próxima aula
  const buscarProximaAula = async () => {
    if (!currentUser?.id) return;

    try {
      // Buscar todos os módulos do curso em ordem
      const { data: modulos, error: errorModulos } = await supabase
        .from("modulos")
        .select(
          `
          id, 
          titulo, 
          ordem_indice,
          curso_id
        `
        )
        .order("ordem_indice", { ascending: true });

      if (errorModulos) throw errorModulos;

      // Buscar todas as videoaulas dos módulos
      const { data: aulas, error: errorAulas } = await supabase
        .from("videoaulas")
        .select(
          `
          id, 
          titulo, 
          ordem_indice,
          modulo_id,
          modulos!inner (
            id,
            titulo,
            ordem_indice,
            curso_id
          )
        `
        )
        .order("ordem_indice", { ascending: true });

      if (errorAulas) throw errorAulas;

      // Organizar aulas por módulo
      const aulasPorModulo = modulos.reduce((acc, modulo) => {
        acc[modulo.id] = aulas
          .filter((aula) => aula.modulo_id === modulo.id)
          .sort((a, b) => a.ordem_indice - b.ordem_indice);
        return acc;
      }, {});

      // Encontrar a posição da última aula vista
      let encontrouUltimaAula = false;
      let proximaAulaEncontrada = null;

      for (const modulo of modulos) {
        const aulasDoModulo = aulasPorModulo[modulo.id] || [];

        for (const aula of aulasDoModulo) {
          if (encontrouUltimaAula) {
            proximaAulaEncontrada = aula;
            break;
          }

          if (aula.id === ultimaAulaVista?.videoaulas?.id) {
            encontrouUltimaAula = true;
          }
        }

        if (proximaAulaEncontrada) break;
      }

      setProximaAula(proximaAulaEncontrada);
    } catch (error) {
      console.error("Erro ao buscar próxima aula:", error);
    }
  };

  // Atualizar próxima aula quando a última aula vista mudar
  useEffect(() => {
    if (ultimaAulaVista?.videoaulas?.id) {
      buscarProximaAula();
    }
  }, [ultimaAulaVista]);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Buscar curso e módulos em uma única query
        const { data: courseData, error: courseError } = await supabase
          .from("cursos")
          .select(
            `
            *,
            modulos (
              *,
              videoaulas (*)
            )
          `
          )
          .eq("id", courseId)
          .single();

        if (courseError) throw courseError;

        setCourse(courseData);

        // Encontrar módulo atual
        const foundModule = courseData?.modulos?.find((m) => m.id === moduleId);
        setCurrentModule(foundModule);

        // Encontrar aula atual
        const foundLesson = foundModule?.videoaulas?.find(
          (l) => l.id === lessonId
        );
        setCurrentLesson(foundLesson);
        if (foundLesson) {
          setCurrentVideoId(foundLesson.video_id);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do curso:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, moduleId, lessonId]);

  // Loading state para o conteúdo do curso
  if (loading) {
    return (
      <div className="flex h-full">
        {/* Loading para o sidebar */}
        <div className="w-80 border-r border-border bg-card">
          <div className="p-4 space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-6 w-full bg-gray-200 animate-pulse rounded"></div>
                  <div className="pl-4 space-y-2">
                    {[1, 2].map((j) => (
                      <div
                        key={j}
                        className="h-4 w-5/6 bg-gray-200 animate-pulse rounded"
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading para o player de vídeo */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <div className="h-8 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-96 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não houver lição ou se showExplore for true, mostra a página de exploração
  if (!currentLesson || location.state?.showExplore) {
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
                          <p className="text-lg sm:text-2xl font-bold">
                            {completedQuestions}
                          </p>
                          <span className="text-xs text-green-500 truncate">
                            {todayQuestions > 0
                              ? `+${todayQuestions} questão${
                                  todayQuestions > 1 ? "s" : ""
                                } hoje`
                              : "Nenhuma questão hoje"}
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
                          <p className="text-lg sm:text-2xl font-bold">
                            {unlockedAchievements.length}
                          </p>
                          {unlockedAchievements.length > 0 && (
                            <span className="text-xs text-green-500 truncate">
                              Desbloqueadas
                            </span>
                          )}
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
                          Aulas Concluídas
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-lg sm:text-2xl font-bold">
                            {completedLessons.length}
                          </p>
                          <span className="text-xs text-green-500 truncate">
                            {todayLessons > 0
                              ? `+${todayLessons} aula${
                                  todayLessons > 1 ? "s" : ""
                                } hoje`
                              : "Nenhuma aula hoje"}
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
                          <p className="text-lg sm:text-2xl font-bold">
                            {horasEstudadas}
                          </p>
                          <span className="text-xs text-green-500 truncate">
                            +{tempoHoje} hoje
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
                <ContinueStudying
                  lastViewedLesson={ultimaAulaVista}
                  courseProgress={progressoCurso}
                />

                {/* Próximas Atividades */}
                <NextActivities
                  nextLesson={proximaAula}
                  lastViewedLesson={ultimaAulaVista}
                />
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
              <div className="rounded-lg p-4 sm:p-6 border bg-card text-card-foreground mb-4 lg:mb-0">
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
              <div className="mt-4 lg:mt-0">
                <DailyEvents noMargin />
              </div>
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
      <div className="lg:col-span-12 h-full overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 md:px-6 lg:px-8">
          <div className="lg:col-start-2 lg:col-span-10 xl:col-start-3 xl:col-span-8 p-4 md:p-6 space-y-4 md:space-y-6">
            <h1 className="text-xl md:text-2xl font-bold">
              {currentLesson.title}
            </h1>

            <div
              className="relative rounded-lg overflow-hidden bg-black w-full max-w-4xl mx-auto"
              style={{ boxShadow: "0 4px 20px rgba(243, 201, 44, 0.2)" }}
            >
              <div className="aspect-video relative">
                {isVimeoVideo && vimeoId ? (
                  <VimeoPlayer
                    videoId={vimeoId}
                    onVideoEnd={() => handleVideoEnd()}
                    lessonId={currentLesson.id}
                  />
                ) : (
                  <PandaVideo
                    videoUrl={videoUrl}
                    videoId={currentLesson.id}
                    userId={currentUser?.id}
                    onVideoEnd={() => handleVideoEnd()}
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
                {currentLesson.description}
              </p>
            </div>

            {Array.isArray(currentLesson.resources) &&
              currentLesson.resources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base md:text-lg font-semibold">
                    Material Complementar
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-full">
                    {currentLesson.resources.map((resource) => (
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

            {currentLesson.nextLesson && (
              <div className="pt-4">
                <Button
                  className="w-full sm:w-auto flex items-center gap-2"
                  style={{
                    background:
                      "linear-gradient(90deg, #B4902A -158.27%, #F3C92C 108.81%)",
                    border: "none",
                  }}
                  onClick={() => currentLesson.onNextLesson()}
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
        <FloatingChatButton />
      </div>

      {/* Modal de Conquistas */}
      <AchievementsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        achievement={currentAchievement}
      />
    </div>
  );
}

export default CourseContent;
