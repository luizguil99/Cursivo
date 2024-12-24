import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  LayoutDashboard,
  LogOut,
  Folders,
  ListChecks,
  ArrowLeft,
  Bell,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex flex-1 flex-col bg-card px-2 py-6">
          <div className="px-4">
            <h2 className="text-lg font-semibold tracking-tight mb-1">
              Cursivo
            </h2>
            <p className="text-sm text-muted-foreground">
              Painel Administrativo
            </p>
          </div>
          <div className="mt-8 space-y-2 px-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/courses" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Cursos
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin/manage-courses" className="flex items-center">
                <Folders className="mr-2 h-4 w-4" />
                Gerenciar Cursos
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin/students" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Alunos
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin/questions" className="flex items-center">
                <ListChecks className="mr-2 h-4 w-4" />
                Questões
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin/events" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Eventos
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin/notifications" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notificações
              </Link>
            </Button>
          </div>
          <div className="mt-auto px-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-72">{children}</div>
    </div>
  );
}
