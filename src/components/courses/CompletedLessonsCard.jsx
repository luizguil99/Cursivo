import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function CompletedLessonsCard({ userId }) {
  const [completedLessons, setCompletedLessons] = useState(0);
  const [todayLessons, setTodayLessons] = useState(0);

  useEffect(() => {
    const fetchCompletedLessons = async () => {
      if (!userId) return;

      try {
        // Buscar total de aulas concluídas
        const { data: allLessons, error: lessonsError } = await supabase
          .from("aulas_concluidas")
          .select("id")
          .eq("usuario_id", userId);

        if (lessonsError) throw lessonsError;
        setCompletedLessons(allLessons.length);

        // Buscar aulas concluídas hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: todayData, error: todayError } = await supabase
          .from("aulas_concluidas")
          .select("id")
          .eq("usuario_id", userId)
          .gte("concluido_em", today.toISOString())
          .lt("concluido_em", tomorrow.toISOString());

        if (todayError) throw todayError;
        setTodayLessons(todayData.length);
      } catch (error) {
        console.error("Erro ao buscar aulas concluídas:", error);
      }
    };

    fetchCompletedLessons();

    // Atualizar quando uma aula for concluída
    const handleLessonCompleted = () => {
      fetchCompletedLessons();
    };

    window.addEventListener("lessonCompleted", handleLessonCompleted);
    return () => {
      window.removeEventListener("lessonCompleted", handleLessonCompleted);
    };
  }, [userId]);

  return (
    <div className="group rounded-lg p-3 sm:p-4 border bg-card hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Aulas Concluídas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold">
              {completedLessons}
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
  );
}
