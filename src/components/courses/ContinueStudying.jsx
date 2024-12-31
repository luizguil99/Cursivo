import React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ContinueStudying({ lastViewedLesson, courseProgress }) {
  const navigate = useNavigate();

  const navigateToLastLesson = () => {
    if (lastViewedLesson?.videoaulas) {
      const lesson = lastViewedLesson.videoaulas;
      navigate(
        `/courses/${lesson.modulos.curso_id}/module/${lesson.modulo_id}/lesson/${lesson.id}`,
        { replace: true }
      );
    }
  };

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
              {lastViewedLesson?.videoaulas?.titulo || "Nenhuma aula vista ainda"}
            </h4>
            <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
              {lastViewedLesson?.videoaulas?.modulos?.titulo || ""}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            {lastViewedLesson?.videoaulas?.modulos?.cursos?.titulo || ""}
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-[#F3C92C] h-2 rounded-full transition-all"
              style={{ width: `${courseProgress.porcentagem}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {courseProgress.porcentagem}% concluído • {courseProgress.aulasRestantes}{" "}
            {courseProgress.aulasRestantes === 1 ? "aula restante" : "aulas restantes"}
          </p>
        </div>
        <Button
          onClick={navigateToLastLesson}
          className="bg-[#F3C92C] hover:bg-[#F3C92C]/80 text-background shadow-lg shadow-[#F3C92C]/20 w-full sm:w-auto"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
