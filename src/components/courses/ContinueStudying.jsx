import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export function ContinueStudying({ proximaAulaCallback }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [ultimaAulaVista, setUltimaAulaVista] = useState(null);
  const [progressoCurso, setProgressoCurso] = useState({
    porcentagem: 0,
    aulasRestantes: 0,
  });
  const [proximaAula, setProximaAula] = useState(null);

  // Buscar última aula vista
  const fetchUltimaAulaVista = async () => {
    if (!currentUser?.id) return;

    try {
      console.log("=== BUSCANDO ÚLTIMA AULA VISTA ===");
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
              id,
              titulo,
              curso_id,
              cursos (
                id,
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

      console.log("Última aula vista:", data?.[0]);
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
      console.log(
        "Evento lessonCompleted recebido, atualizando última aula..."
      );
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
      console.log("=== CALCULANDO PROGRESSO DO CURSO ===", cursoId);

      // Buscar total de aulas do curso
      const { data: totalAulas, error: errorTotal } = await supabase
        .from("videoaulas")
        .select("id, modulo_id, modulos!inner(curso_id)")
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

      console.log("Progresso calculado:", {
        total,
        completas,
        restantes,
        porcentagem,
      });

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
      console.log("Evento lessonCompleted recebido, atualizando progresso...");
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
    if (!currentUser?.id || !ultimaAulaVista?.videoaulas?.modulos?.curso_id)
      return;

    try {
      console.log("=== BUSCANDO PRÓXIMA AULA ===");
      const cursoId = ultimaAulaVista.videoaulas.modulos.curso_id;
      console.log("Curso ID:", cursoId);
      console.log("Última aula vista:", ultimaAulaVista.videoaulas);

      // Buscar módulos do curso
      const { data: modulos, error: modulesError } = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", cursoId)
        .order("ordem_indice", { ascending: true });

      if (modulesError) throw modulesError;

      console.log("Módulos encontrados:", modulos);

      // Buscar vídeos do curso
      const { data: videos, error: videosError } = await supabase
        .from("videoaulas")
        .select("*")
        .in(
          "modulo_id",
          modulos.map((m) => m.id)
        )
        .order("ordem_indice", { ascending: true });

      if (videosError) throw videosError;

      console.log("Vídeos encontrados:", videos);

      // Organizar vídeos por módulo e ordenar por ordem
      const videosByModule = modulos.reduce((acc, module) => {
        acc[module.id] = videos
          .filter((video) => video.modulo_id === module.id)
          .sort((a, b) => (a.ordem_indice || 0) - (b.ordem_indice || 0));
        return acc;
      }, {});

      console.log("Vídeos organizados por módulo:", videosByModule);

      // Encontrar a próxima aula
      let encontrouUltimaAula = false;
      let proximaAulaEncontrada = null;

      // Iterar pelos módulos em ordem
      for (const modulo of modulos) {
        const videosDoModulo = videosByModule[modulo.id] || [];
        console.log(`Verificando módulo ${modulo.titulo}:`, videosDoModulo);

        for (const video of videosDoModulo) {
          if (encontrouUltimaAula) {
            proximaAulaEncontrada = {
              ...video,
              modulos: modulo, // Adicionar informações do módulo
            };
            break;
          }

          if (video.id === ultimaAulaVista.videoaulas.id) {
            console.log("Encontrou última aula vista:", video.titulo);
            encontrouUltimaAula = true;
          }
        }

        if (proximaAulaEncontrada) break;
      }

      console.log(
        "Próxima aula encontrada:",
        proximaAulaEncontrada
          ? {
              id: proximaAulaEncontrada.id,
              titulo: proximaAulaEncontrada.titulo,
              modulo: proximaAulaEncontrada.modulos.titulo,
              ordem_modulo: proximaAulaEncontrada.modulos.ordem_indice,
              ordem_aula: proximaAulaEncontrada.ordem_indice,
            }
          : "Nenhuma próxima aula disponível"
      );

      setProximaAula(proximaAulaEncontrada);
    } catch (error) {
      console.error("Erro ao buscar próxima aula:", error);
    }
  };

  // Buscar próxima aula quando a última aula vista mudar
  useEffect(() => {
    buscarProximaAula();
  }, [ultimaAulaVista, currentUser?.id]);

  // Atualizar próxima aula quando encontrada
  useEffect(() => {
    if (proximaAula) {
      proximaAulaCallback?.(proximaAula);
    }
  }, [proximaAula]);

  return (
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
              {ultimaAulaVista?.videoaulas?.titulo || "Carregando..."}
            </h4>
            <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
              {ultimaAulaVista?.videoaulas?.modulos?.titulo || ""}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            {ultimaAulaVista?.videoaulas?.modulos?.cursos?.titulo || ""}
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-[#F3C92C] h-2 rounded-full transition-all"
              style={{ width: `${progressoCurso.porcentagem}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {progressoCurso.porcentagem}% concluído •{" "}
            {progressoCurso.aulasRestantes} aulas restantes
          </p>
        </div>
        <Button
          onClick={() => {
            const aula = ultimaAulaVista?.videoaulas;
            if (aula) {
              const url = `/courses/${aula.modulos.curso_id}/module/${aula.modulo_id}/lesson/${aula.id}`;
              console.log("Navegando para:", url);
              navigate(url);
            }
          }}
          className="bg-[#F3C92C] hover:bg-[#F3C92C]/80 text-background shadow-lg shadow-[#F3C92C]/20 w-full sm:w-auto"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
