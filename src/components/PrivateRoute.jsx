import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/contexts/AccessContext";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const { userData } = useAccess();

  // Se não estiver autenticado, redireciona para o login
  if (!currentUser) {
    return <Navigate to="/" />;
  }

  // Se o usuário estiver inativo, redireciona para uma página de acesso negado
  if (userData?.status === "inactive") {
    return <Navigate to="/access-denied" />;
  }

  return children;
}

export default PrivateRoute;
