import { Navigate } from "react-router-dom";
import { useAccess } from "@/contexts/AccessContext";

const ADMIN_EMAILS = [
  "admin@admin.com",
  "admin@cursivo.com",
  "cursivo@admin.com",
];

export function ProtectedRoute({ children, adminOnly = false }) {
  const { loading, hasAccess, userData } = useAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se o usuário for admin, permite acesso independente do status do plano
  if (userData?.email && ADMIN_EMAILS.includes(userData.email)) {
    return children;
  }

  // Se precisar ser admin e o usuário não for admin, redireciona
  if (adminOnly && (!userData || !ADMIN_EMAILS.includes(userData.email))) {
    return <Navigate to="/access-denied" />;
  }

  // Se não tiver acesso (plano expirado ou inativo)
  if (!hasAccess) {
    return <Navigate to="/access-denied" />;
  }

  return children;
}
