import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AchievementsCard({ userId }) {
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [recentAchievement, setRecentAchievement] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!userId) return;

      try {
        // Buscar total de conquistas desbloqueadas
        const { data: achievements, error: achievementsError } = await supabase
          .from("conquistas_usuarios")
          .select(`
            id,
            desbloqueado_em,
            conquistas (
              nome,
              descricao
            )
          `)
          .eq("usuario_id", userId);

        if (achievementsError) throw achievementsError;

        setTotalAchievements(achievements.length);

        // Verificar se há conquista recente (últimas 24 horas)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentAchievements = achievements.filter(achievement => {
          const unlockDate = new Date(achievement.desbloqueado_em);
          return unlockDate > oneDayAgo;
        });

        setRecentAchievement(recentAchievements[0]); // Pega a conquista mais recente
      } catch (error) {
        console.error("Erro ao buscar conquistas:", error);
      }
    };

    fetchAchievements();

    // Atualizar quando uma nova conquista for desbloqueada
    const handleNewAchievement = () => {
      fetchAchievements();
    };

    window.addEventListener("achievementUnlocked", handleNewAchievement);
    return () => {
      window.removeEventListener("achievementUnlocked", handleNewAchievement);
    };
  }, [userId]);

  return (
    <div className="group rounded-lg p-3 sm:p-4 border bg-card hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Conquistas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold">
              {totalAchievements}
            </p>
            {recentAchievement && (
              <span className="text-xs text-green-500 truncate">
                Nova conquista!
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
  );
}
