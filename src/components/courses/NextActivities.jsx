import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import PracticeModal from "./PracticeModal";
import { supabase } from "@/lib/supabase";

export function NextActivities({ nextLesson }) {
  const navigate = useNavigate();
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [cursoInfo, setCursoInfo] = useState(null);
  const [numQuestoes, setNumQuestoes] = useState(0);

  useEffect(() => {
    const fetchCursoInfo = async () => {
      if (nextLesson?.modulos?.curso_id) {
        try {
          // Buscar informações do curso
          const { data: curso, error: cursoError } = await supabase
            .from("cursos")
            .select("titulo")
            .eq("id", nextLesson.modulos.curso_id)
            .single();

          if (cursoError) throw cursoError;
          setCursoInfo(curso);

          // Buscar número de questões
          const { count, error: questoesError } = await supabase
            .from("questoes")
            .select("id", { count: 'exact' })
            .eq("topico", nextLesson.modulos.titulo);

          if (questoesError) throw questoesError;
          setNumQuestoes(count || 0);
        } catch (error) {
          console.error("Erro ao buscar informações:", error);
        }
      }
    };

    fetchCursoInfo();
  }, [nextLesson?.modulos?.curso_id, nextLesson?.modulos?.titulo]);

  const navigateToNextLesson = () => {
    if (nextLesson?.modulos?.curso_id) {
      navigate(
        `/courses/${nextLesson.modulos.curso_id}/module/${nextLesson.modulo_id}/lesson/${nextLesson.id}`,
        { replace: true }
      );
    }
  };

  const handlePracticeComplete = () => {
    setShowPracticeModal(false);
  };

  return (
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
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm sm:text-base">
                {nextLesson?.titulo || "Nenhuma próxima aula disponível"}
              </p>
              {nextLesson && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  Novo
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {nextLesson?.modulos?.titulo || ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto mt-2 sm:mt-0"
            onClick={navigateToNextLesson}
            disabled={!nextLesson}
          >
            Iniciar
          </Button>
        </div>

        <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300">
          <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm sm:text-base">
                Questões de {cursoInfo?.titulo || ""}
              </p>
              <span className="px-2 py-0.5 text-xs border border-primary/20 text-primary rounded-full">
                {numQuestoes} questões
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {nextLesson?.modulos?.titulo || ""}
            </p>
          </div>
          <Button
            onClick={() => setShowPracticeModal(true)}
            className="bg-[#F3C92C] hover:bg-[#F3C92C]/80 text-background shadow-lg shadow-[#F3C92C]/20 w-full sm:w-auto"
            disabled={numQuestoes === 0}
          >
            Resolver
          </Button>
        </div>
      </div>

      {showPracticeModal && (
        <PracticeModal
          course={cursoInfo?.titulo}
          topic={nextLesson?.titulo}
          onClose={() => setShowPracticeModal(false)}
          onQuestionComplete={handlePracticeComplete}
          totalQuestions={numQuestoes}
        />
      )}
    </div>
  );
}
