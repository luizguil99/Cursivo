import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Brain, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PracticeModal from "./PracticeModal";
import { supabase } from "@/lib/supabase";

export function NextActivities({
  nextLesson,
  onCoursesClick,
  onScheduleClick,
}) {
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
            .select("*")
            .eq("id", nextLesson.modulos.curso_id)
            .single();

          if (cursoError) throw cursoError;

          const formattedCourse = {
            ...curso,
            name: curso.titulo,
            title: curso.titulo,
          };

          setCursoInfo(formattedCourse);

          // Buscar número de questões usando o título do curso
          const { data: questoes, error: questoesError } = await supabase
            .from("questoes")
            .select("*")
            .eq("assunto", curso.titulo);

          if (questoesError) {
            console.error("Erro ao buscar questões:", questoesError);
            throw questoesError;
          }

          setNumQuestoes(questoes?.length || 0);
        } catch (error) {
          console.error("Erro ao buscar informações:", error);
        }
      }
    };

    fetchCursoInfo();
  }, [nextLesson?.modulos?.curso_id]);

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

  // Se não houver próxima aula, mostra os cards de engajamento
  if (!nextLesson) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold">
            Próximas Atividades
          </h3>
        </div>
        <div className="space-y-3">
          {/* Card de Cronograma */}
          <div className="group p-6 border rounded-lg bg-card hover:border-primary/50 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                <CalendarDays
                  className="h-5 w-5 text-primary"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm sm:text-base">
                    Crie seu cronograma de estudos
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Organize seus estudos e aumente sua produtividade
                </p>
              </div>
              <Button
                onClick={() => {
                  onScheduleClick();
                }}
                className="w-full sm:w-auto mt-4 sm:mt-0 bg-[#F3C92C] hover:bg-[#F3C92C]/80 text-background shadow-lg shadow-[#F3C92C]/20"
              >
                Criar Cronograma
              </Button>
            </div>
          </div>

          {/* Card da Comunidade */}
          <div className="group p-6 border rounded-lg bg-card hover:border-primary/50 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm sm:text-base">
                    Junte-se à nossa comunidade
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte-se com outros alunos e compartilhe experiências
                </p>
              </div>
              <Button
                onClick={() => navigate("/community")}
                className="w-full sm:w-auto mt-4 sm:mt-0 bg-[#F3C92C] hover:bg-[#F3C92C]/80 text-background shadow-lg shadow-[#F3C92C]/20"
              >
                Acessar Comunidade
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold">
          Próximas Atividades
        </h3>
      </div>
      <div className="space-y-3">
        <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-300">
          <div className="bg-primary/10 p-2 sm:p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm sm:text-base">
                {nextLesson.titulo}
              </p>
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                Novo
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto mt-2 sm:mt-0"
            onClick={navigateToNextLesson}
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
                {numQuestoes} {numQuestoes === 1 ? "questão" : "questões"}
              </span>
            </div>
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
          course={cursoInfo}
          onClose={() => setShowPracticeModal(false)}
          onQuestionComplete={handlePracticeComplete}
        />
      )}
    </div>
  );
}
