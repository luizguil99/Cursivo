import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import { useState, useEffect } from "react";
import { isAdmin } from "../lib/supabase";

export default function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!currentUser) {
        setIsUserAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const adminStatus = await isAdmin(currentUser);
        setIsUserAdmin(adminStatus);
      } catch (error) {
        console.error("Erro ao verificar status de admin:", error);
        setIsUserAdmin(false);
      }
      setLoading(false);
    }

    checkAdminStatus();
  }, [currentUser]);

  // Mostra loading enquanto verifica
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não houver usuário logado, redireciona para a página de login
  if (!currentUser) {
    console.log("AdminRoute - Usuário não logado, redirecionando para /");
    return <Navigate to="/" />;
  }

  // Se o usuário não for admin, redireciona para a página inicial
  if (!isUserAdmin) {
    console.log("AdminRoute - Usuário não é admin:", currentUser.email);
    return <Navigate to="/" />;
  }

  // Se chegou aqui, o usuário é admin
  console.log("AdminRoute - Acesso permitido para:", currentUser.email);
  return <AdminLayout>{children}</AdminLayout>;
}
