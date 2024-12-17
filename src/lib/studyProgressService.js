import { supabase } from "./supabase";

export const studyProgressService = {
  // Buscar todos os progressos de uma disciplina de uma vez
  async getAllTopicsProgress(subjectId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Busca todos os progressos da disciplina de uma vez
      const { data, error } = await supabase
        .from("study_progress")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao buscar progressos:", error);
        return null;
      }

      // Retorna um objeto mapeado por nome do tópico
      return data.reduce((acc, progress) => {
        acc[progress.topic_name] = {
          teoria: !!progress.teoria,
          resumo: !!progress.resumo,
          exercicio: !!progress.exercicio,
          revisao_status: progress.revisao_status || "Não revisado"
        };
        return acc;
      }, {});
    } catch (error) {
      console.error("Erro ao buscar progressos:", error);
      return null;
    }
  },

  // Atualizar progresso
  async updateProgress(subjectId, topicName, field, value) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existingProgress } = await supabase
        .from("study_progress")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("topic_name", topicName)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProgress) {
        // Atualizar progresso existente
        const { data, error } = await supabase
          .from("study_progress")
          .update({
            [field]: value,
            updated_at: new Date().toISOString(),
          })
          .eq("subject_id", subjectId)
          .eq("topic_name", topicName)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Criar novo progresso
      const newProgress = {
        user_id: user.id,
        subject_id: subjectId,
        topic_name: topicName,
        teoria: field === "teoria" ? value : false,
        resumo: field === "resumo" ? value : false,
        exercicio: field === "exercicio" ? value : false,
        revisao_status: field === "revisao_status" ? value : "Não revisado",
      };

      const { data, error } = await supabase
        .from("study_progress")
        .insert([newProgress])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      throw error;
    }
  },
};
