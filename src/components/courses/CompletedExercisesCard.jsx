import React, { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function CompletedExercisesCard({ userId }) {
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [todayQuestions, setTodayQuestions] = useState(0);

  useEffect(() => {
    const fetchCompletedExercises = async () => {
      if (!userId) return;

      try {
        // Buscar total de questões concluídas
        const { data: allQuestions, error: questionsError } = await supabase
          .from("questoes_concluidas")
          .select("id")
          .eq("usuario_id", userId);

        if (questionsError) throw questionsError;
        setCompletedQuestions(allQuestions.length);

        // Buscar questões concluídas hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: todayData, error: todayError } = await supabase
          .from("questoes_concluidas")
          .select("id")
          .eq("usuario_id", userId)
          .gte("concluido_em", today.toISOString())
          .lt("concluido_em", tomorrow.toISOString());

        if (todayError) throw todayError;
        setTodayQuestions(todayData.length);
      } catch (error) {
        console.error("Erro ao buscar exercícios concluídos:", error);
      }
    };

    fetchCompletedExercises();

    // Atualizar quando uma questão for concluída
    const handleQuestionCompleted = () => {
      fetchCompletedExercises();
    };

    window.addEventListener("questionCompleted", handleQuestionCompleted);
    return () => {
      window.removeEventListener("questionCompleted", handleQuestionCompleted);
    };
  }, [userId]);

  return (
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
  );
}
