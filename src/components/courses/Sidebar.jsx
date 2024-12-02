import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  CalendarDays,
  BookOpen,
  LogOut,
  GraduationCap,
  LineChart,
  Users,
  Library,
  Brain,
  Target,
  Lightbulb,
  Home,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import CourseList from "./CourseList";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function Sidebar({ onCourseSelect, onScheduleClick }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showCourses, setShowCourses] = React.useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleCourseSelect = (course) => {
    onCourseSelect(course);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const mainButtons = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      onClick: () => {
        onCourseSelect(null);
        navigate("/courses", { 
          replace: true,
          state: { showExplore: true }
        });
      },
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Cursos",
      onClick: () => setShowCourses(!showCourses),
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      label: "Cronograma",
      onClick: onScheduleClick,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Guia de Estudos",
      onClick: () => navigate("/study-guide"),
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      label: "Desempenho",
      onClick: () => navigate("/performance"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Comunidade",
      onClick: () => navigate("/community"),
    },
    {
      icon: <Library className="h-5 w-5" />,
      label: "Recursos",
      onClick: () => navigate("/resources"),
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: "Simulados",
      onClick: () => navigate("/simulations"),
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Metas",
      onClick: () => navigate("/goals"),
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      label: "Ferramentas",
      onClick: () => navigate("/tools"),
    },
  ];

  return (
    <aside
      className={cn(
        "relative h-screen border-r bg-card transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 h-14 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Menu</h2>}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Main Navigation Buttons */}
      <div className="p-2 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#F3C92C] scrollbar-track-transparent hover:scrollbar-thumb-[#B4902A]">
        <div className="space-y-1">
          {mainButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "w-full flex items-center gap-3 justify-start px-3 py-2 hover:bg-accent/50",
                collapsed && "w-12 p-0 justify-center"
              )}
              onClick={button.onClick}
            >
              {button.icon}
              {!collapsed && (
                <span className="text-sm font-medium">{button.label}</span>
              )}
            </Button>
          ))}
        </div>

        {/* Course List */}
        {showCourses && !collapsed && (
          <>
            <Separator className="my-2" />
            <div className="transition-all duration-300">
              <CourseList onCourseSelect={handleCourseSelect} />
            </div>
          </>
        )}
      </div>

      {/* Logout Button at Bottom */}
      <div className="p-2 mt-auto border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center gap-3 justify-start px-3 py-2 hover:bg-accent/50",
            collapsed && "w-12 p-0 justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}

export default Sidebar;
