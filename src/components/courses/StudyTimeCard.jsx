import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Função auxiliar para formatar o tempo
const formatTime = (seconds) => {
  if (!seconds || seconds === 0) {
    return "0h";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
};

export function StudyTimeCard({ userId }) {
  const [totalTime, setTotalTime] = useState(0);
  const [todayTime, setTodayTime] = useState(0);

  useEffect(() => {
    const fetchStudyTime = async () => {
      if (!userId) return;

      try {
        // Buscar todos os registros de aulas concluídas
        const { data: allCompletions, error: totalError } = await supabase
          .from("aulas_concluidas")
          .select("tempo_assistido, concluido_em")
          .eq("usuario_id", userId);

        if (totalError) throw totalError;

        // Calcular tempo total (em segundos)
        const total = allCompletions.reduce((acc, curr) => {
          return acc + (curr.tempo_assistido || 0);
        }, 0);

        // Calcular tempo de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySeconds = allCompletions.reduce((acc, curr) => {
          const completionDate = new Date(curr.concluido_em);
          if (completionDate >= today) {
            return acc + (curr.tempo_assistido || 0);
          }
          return acc;
        }, 0);

        setTotalTime(total);
        setTodayTime(todaySeconds);
      } catch (error) {
        console.error("Erro ao buscar tempo de estudo:", error);
      }
    };

    fetchStudyTime();

    // Atualizar quando uma nova aula for concluída
    const handleLessonCompleted = () => {
      fetchStudyTime();
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
            Horas Estudadas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold">
              {formatTime(totalTime)}
            </p>
            {todayTime > 0 && (
              <span className="text-xs text-green-500 truncate">
                +{formatTime(todayTime)} hoje
              </span>
            )}
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
  );
}
