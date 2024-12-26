import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper functions for auth
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        role: "student",
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // After successful login, update the last login timestamp
    if (data.user) {
      const { error: updateError } = await supabase
        .from("perfis")
        .update({ ultimo_login: new Date().toISOString() })
        .eq("id", data.user.id);

      if (updateError) {
        console.error("Error updating last login:", updateError);
      }
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });
  if (error) throw error;
  return data;
};

// Função para criar perfil de admin
export const createAdminProfile = async (user) => {
  if (!user) return false;

  try {
    const { error: createError } = await supabase.from("perfis").insert([
      {
        id: user.id,
        email: user.email,
        nome: user.user_metadata?.name || "Admin",
        papel: "admin",
        status: "ativo",
        status_plano: "ativo",
        plano: "vitalicio",
        data_inicio_plano: new Date().toISOString(),
      },
    ]);

    if (createError) throw createError;
    return true;
  } catch (error) {
    console.error("Erro ao criar perfil admin:", error);
    return false;
  }
};

// Lista de emails admin
const ADMIN_EMAILS = [
  "admin@admin.com",
  "admin@cursivo.com",
  "cursivo@admin.com",
];

// Função para verificar se é admin
export const isAdmin = async (user) => {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email);
};

// Função para enviar email de reset de senha
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return data;
};

// Auth state change listener
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

// Funções para gerenciar progresso do usuário
export const updateUserProgress = async (userId, courseId, progress) => {
  try {
    const { data, error } = await supabase.from("progresso_usuario").upsert(
      {
        usuario_id: userId,
        curso_id: courseId,
        progresso: progress,
        atualizado_em: new Date().toISOString(),
      },
      {
        onConflict: "usuario_id,curso_id",
      }
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao atualizar progresso:", error);
    throw error;
  }
};

export const getUserProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("progresso_usuario")
      .select("*")
      .eq("usuario_id", userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    throw error;
  }
};

// Funções da Comunidade

// Buscar todas as discussões
export const getDiscussions = async (userId) => {
  try {
    // Buscar discussões com comentários e perfis dos usuários
    const { data: discussions, error } = await supabase
      .from("publicacao_comunidade")
      .select(
        `
        *,
        comentarios:comentarios_comunidade(
          id,
          conteudo,
          criado_em,
          usuario_id,
          curtidas,
          usuario:usuario_id(*)
        ),
        usuario:usuario_id(*)
      `
      )
      .order("criado_em", { ascending: false });

    if (error) throw error;

    // Processar os dados para incluir informações adicionais
    const processedDiscussions = discussions.map((discussion) => ({
      ...discussion,
      user_metadata: {
        ...discussion.usuario?.user_metadata,
        nome: discussion.usuario?.nome || "Usuário",
      },
      comments: discussion.comentarios.map((comment) => ({
        ...comment,
        user_metadata: {
          ...comment.usuario?.user_metadata,
          nome: comment.usuario?.nome || "Usuário",
        },
      })),
      likes_count: discussion.curtidas || 0,
      comments_count: discussion.comentarios_count || 0,
    }));

    return processedDiscussions;
  } catch (error) {
    console.error("Erro ao buscar discussões:", error);
    return [];
  }
};

// Buscar uma discussão específica
export const getDiscussion = async (id) => {
  try {
    const { data, error } = await supabase
      .from("publicacao_comunidade")
      .select(
        `
        *,
        usuario:usuario_id (
          id,
          email,
          user_metadata
        ),
        comentarios:comentarios_comunidade (
          id,
          conteudo,
          criado_em,
          usuario_id,
          curtidas
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar discussão:", error);
    return null;
  }
};

// Criar uma nova discussão
export const createDiscussion = async (title, content, userId) => {
  try {
    const { data, error } = await supabase
      .from("publicacao_comunidade")
      .insert([
        {
          titulo: title,
          conteudo: content,
          usuario_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao criar discussão:", error);
    throw error;
  }
};

// Adicionar comentário em uma discussão
export const addComment = async (discussionId, content, userId) => {
  try {
    // Insere o comentário
    const { data, error } = await supabase
      .from("comentarios_comunidade")
      .insert([
        {
          publicacao_id: discussionId,
          conteudo: content,
          usuario_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Atualiza o contador de comentários na publicação
    const { error: updateError } = await supabase
      .from("publicacao_comunidade")
      .update({
        comentarios_count: supabase.raw("comentarios_count + 1"),
      })
      .eq("id", discussionId);

    if (updateError) throw updateError;

    return data;
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    throw error;
  }
};

// Curtir/descurtir uma discussão
export const toggleDiscussionLike = async (discussionId, userId) => {
  try {
    const { data: publicacao } = await supabase
      .from("publicacao_comunidade")
      .select("curtidas")
      .eq("id", discussionId)
      .single();

    const { error } = await supabase
      .from("publicacao_comunidade")
      .update({
        curtidas: (publicacao.curtidas || 0) + 1,
      })
      .eq("id", discussionId);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao curtir/descurtir discussão:", error);
    throw error;
  }
};

// Deletar uma discussão
export const deleteDiscussion = async (discussionId, userId) => {
  try {
    // Primeiro verifica se o usuário é dono da publicação
    const { data: publicacao } = await supabase
      .from("publicacao_comunidade")
      .select("usuario_id")
      .eq("id", discussionId)
      .single();

    if (!publicacao || publicacao.usuario_id !== userId) {
      throw new Error("Você não tem permissão para excluir esta publicação");
    }

    // Deleta a publicação
    const { error } = await supabase
      .from("publicacao_comunidade")
      .delete()
      .eq("id", discussionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao deletar discussão:", error);
    throw error;
  }
};

// Funções de Avatar
export const updateUserAvatar = async (userId, style, seed) => {
  try {
    // Gera a URL do avatar com o estilo e seed selecionados
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
      seed
    )}`;

    // Atualiza o avatar no auth.users
    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_style: style,
        avatar_seed: seed,
        avatar_url: avatarUrl,
      },
    });

    if (error) throw error;
    return { avatarUrl, style, seed };
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    throw error;
  }
};

export const getUserAvatar = (user) => {
  if (user?.user_metadata?.avatar_url) {
    return user.user_metadata.avatar_url;
  }

  // Se não tiver avatar salvo, gera um com estilo padrão
  const seed = user?.id || user?.email || "default";
  const style = user?.user_metadata?.avatar_style || "adventurer";
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

// Funções para o cronograma semanal
export const getScheduleBlocks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    // Organizar os blocos por dia
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    data.forEach((block) => {
      if (schedule[block.day_id]) {
        schedule[block.day_id].push({
          id: block.id,
          name: block.name,
          duration: block.duration,
          color: block.color,
        });
      }
    });

    return schedule;
  } catch (error) {
    console.error("Erro ao buscar blocos do cronograma:", error);
    throw error;
  }
};

export const addScheduleBlock = async (userId, dayId, block) => {
  try {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .insert([
        {
          user_id: userId,
          day_id: dayId,
          name: block.name,
          duration: block.duration,
          color: block.color,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao adicionar bloco ao cronograma:", error);
    throw error;
  }
};

export const updateScheduleBlock = async (blockId, block) => {
  try {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .update({
        name: block.name,
        duration: block.duration,
        color: block.color,
      })
      .eq("id", blockId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao atualizar bloco do cronograma:", error);
    throw error;
  }
};

export const deleteScheduleBlock = async (blockId) => {
  try {
    const { error } = await supabase
      .from("schedule_blocks")
      .delete()
      .eq("id", blockId);

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao deletar bloco do cronograma:", error);
    throw error;
  }
};

export const moveScheduleBlock = async (blockId, newDayId) => {
  try {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .update({ day_id: newDayId })
      .eq("id", blockId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao mover bloco do cronograma:", error);
    throw error;
  }
};
