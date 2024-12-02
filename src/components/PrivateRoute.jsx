import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/contexts/AccessContext";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const { loading, hasAccess, userData } = useAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login
  if (!currentUser) {
    return <Navigate to="/" />;
  }

  // Se o usuário estiver inativo, redireciona para a página de acesso negado
  if (!hasAccess) {
    return <Navigate to="/access-denied" />;
  }

  return children;
}

export default PrivateRoute;
