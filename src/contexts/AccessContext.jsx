import { createContext, useContext, useState, useEffect } from "react";
import { supabase, isAdmin } from "../lib/supabase";

const AccessContext = createContext();

export function AccessProvider({ children }) {
  const [userAccess, setUserAccess] = useState({
    loading: true,
    hasAccess: false,
    userData: null,
  });

  const checkUserAccess = async (user) => {
    if (!user) {
      setUserAccess({
        loading: false,
        hasAccess: false,
        userData: null,
      });
      return;
    }

    try {
      // Primeiro verifica se é admin
      const adminStatus = await isAdmin(user);
      if (adminStatus) {
        setUserAccess({
          loading: false,
          hasAccess: true,
          userData: { ...user, papel: "admin", status: "ativo" }
        });
        return;
      }

      // Se não for admin, verifica o perfil normal
      const { data: userData, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // Verifica se o usuário está ativo
      const hasAccess = userData?.status === "ativo";

      setUserAccess({
        loading: false,
        hasAccess,
        userData,
      });
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      setUserAccess({
        loading: false,
        hasAccess: false,
        userData: null,
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      checkUserAccess(session?.user);
    });

    // Verificar estado inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserAccess(session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshAccess = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserAccess(session?.user);
    });
  };

  return (
    <AccessContext.Provider value={{ ...userAccess, refreshAccess }}>
      {children}
    </AccessContext.Provider>
  );
}

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccess deve ser usado dentro de um AccessProvider");
  }
  return context;
};
