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
    const { error: createError } = await supabase
      .from("perfis")
      .insert([
        {
          id: user.id,
          email: user.email,
          nome: user.user_metadata?.name || 'Admin',
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
  "cursivo@admin.com"
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
