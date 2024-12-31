import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export function useAchievements(userId) {
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  // Buscar conquistas do usuário
  const fetchAchievements = async () => {
    if (!userId) return;

    try {
      // Buscar todas as conquistas
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("conquistas")
        .select("*");

      if (achievementsError) throw achievementsError;

      // Buscar conquistas desbloqueadas pelo usuário
      const { data: userAchievements, error: userAchievementsError } =
        await supabase
          .from("conquistas_usuarios")
          .select("conquista_id")
          .eq("usuario_id", userId);

      if (userAchievementsError) throw userAchievementsError;

      setAchievements(allAchievements);
      setUnlockedAchievements(userAchievements.map((ua) => ua.conquista_id));

      // Verificar novas conquistas
      await checkNewAchievements();
    } catch (error) {
      console.error("Erro ao buscar conquistas:", error);
    }
  };

  // Verificar novas conquistas
  const checkNewAchievements = async () => {
    if (!userId) return;

    try {
      // Contar aulas concluídas
      const { count: aulasCount, error: aulasError } = await supabase
        .from("aulas_concluidas")
        .select("*", { count: "exact" })
        .eq("usuario_id", userId);

      if (aulasError) throw aulasError;

      // Contar questões concluídas
      const { count: questoesCount, error: questoesError } = await supabase
        .from("questoes_concluidas")
        .select("*", { count: "exact" })
        .eq("usuario_id", userId);

      if (questoesError) throw questoesError;

      // Buscar conquistas não desbloqueadas
      const achievementsToCheck = achievements.filter(
        (a) => !unlockedAchievements.includes(a.id)
      );

      // Verificar quais conquistas devem ser desbloqueadas
      const newAchievements = achievementsToCheck.filter((achievement) => {
        if (achievement.tipo === "aulas") {
          return aulasCount >= achievement.quantidade_necessaria;
        } else if (achievement.tipo === "exercicios") {
          return questoesCount >= achievement.quantidade_necessaria;
        }
        return false;
      });

      // Se houver novas conquistas para desbloquear
      if (newAchievements.length > 0) {
        // Preparar dados para inserção
        const achievementsToInsert = newAchievements.map((achievement) => ({
          usuario_id: userId,
          conquista_id: achievement.id,
        }));

        // Inserir novas conquistas
        const { error: insertError } = await supabase
          .from("conquistas_usuarios")
          .insert(achievementsToInsert);

        if (insertError) throw insertError;

        // Atualizar estado local
        setUnlockedAchievements((prev) => [
          ...prev,
          ...newAchievements.map((a) => a.id),
        ]);

        // Mostrar notificações e modal para cada conquista
        newAchievements.forEach((achievement) => {
          toast.success(`🏆 Nova Conquista Desbloqueada: ${achievement.nome}`, {
            description: achievement.descricao,
          });

          // Dispara o efeito de confete
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Mostrar o modal com a conquista atual
          setCurrentAchievement(achievement);
          setShowModal(true);
        });
      }
    } catch (error) {
      console.error("Erro ao verificar novas conquistas:", error);
    }
  };

  // Efeito para buscar conquistas quando o userId mudar
  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  // Escutar eventos de conclusão
  useEffect(() => {
    const handleCompletion = () => {
      checkNewAchievements();
    };

    window.addEventListener("questionCompleted", handleCompletion);
    window.addEventListener("lessonCompleted", handleCompletion);

    return () => {
      window.removeEventListener("questionCompleted", handleCompletion);
      window.removeEventListener("lessonCompleted", handleCompletion);
    };
  }, [userId, achievements, unlockedAchievements]);

  return {
    achievements,
    unlockedAchievements,
    showModal,
    currentAchievement,
    setShowModal,
    checkNewAchievements,
  };
}
