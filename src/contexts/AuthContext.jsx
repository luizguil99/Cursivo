import React, { createContext, useContext, useState, useEffect } from "react";
import {
  supabase,
  signIn,
  signUp,
  signOut,
  signInWithGoogle,
  isAdmin,
  resetPassword as resetPasswordEmail,
} from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    return signIn(email, password);
  }

  async function signup(email, password) {
    return signUp(email, password);
  }

  async function logout() {
    return signOut();
  }

  async function loginWithGoogle() {
    return signInWithGoogle();
  }

  async function resetPassword(email) {
    return resetPasswordEmail(email);
  }

  useEffect(() => {
    // Listener para mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth State Changed:", session?.user?.email);
      setCurrentUser(session?.user || null);
      setLoading(false);
    });

    // Verificar estado inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
