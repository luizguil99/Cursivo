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
  Brain,
  Video,
  Home,
  ListTodo,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import CourseList from "./CourseList";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";

// Componente para a bolinha pulsante
const PulsingDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
  </span>
);

function Sidebar({ onCourseSelect, onScheduleClick, onModuleSidebarToggle }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showCourses, setShowCourses] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showSchedule, setShowSchedule] = React.useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isMobile = window.innerWidth < 768;

  const handleCourseSelect = (course) => {
    onCourseSelect(course);
    if (isMobile) {
      setShowMobileMenu(false);
      // Força a abertura do ModulesSidebar quando um curso é selecionado
      onModuleSidebarToggle(false); // false significa não colapsado
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Função para lidar com o clique no botão de cursos
  const handleCoursesClick = () => {
    if (window.innerWidth < 768) {
      // md breakpoint
      setShowMobileMenu(true);
    } else {
      setShowCourses(!showCourses);
    }
  };

  const mainButtons = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      onClick: () => {
        if (showSchedule) {
          setShowSchedule(false);
          onScheduleClick();
        } else {
          onCourseSelect(null);
          navigate("/courses", {
            replace: true,
            state: { showExplore: true },
          });
        }
      },
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Cursos",
      onClick: handleCoursesClick,
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      label: "Cronograma",
      onClick: () => {
        setShowSchedule(true);
        onScheduleClick();
      },
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
      icon: <Video className="h-5 w-5" />,
      label: "Aula ao Vivo",
      onClick: () => navigate("/live"),
      extra: <PulsingDot />,
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: "Simulados",
      onClick: () => navigate("/simulations"),
    },
    {
      icon: <ListTodo className="h-5 w-5" />,
      label: "Filtro de Questões",
      onClick: () => navigate("/filterquestions"),
    },
  ];

  return (
    <aside
      className={cn(
        "relative h-screen bg-card transition-all duration-300 flex flex-col border-r",
        // Em dispositivos menores, sempre mostra como fechado
        "w-10 md:w-auto",
        // Larguras responsivas ajustadas para telas maiores
        collapsed ? "md:w-14" : "md:w-56"
      )}
    >
      <div className="flex items-center justify-between p-2 h-10 sm:h-12 md:h-14 border-b">
        {!collapsed && (
          <h2 className="hidden md:block text-sm sm:text-base md:text-lg font-semibold truncate">
            Menu
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 shrink-0",
            "hidden md:flex",
            collapsed && "mx-auto"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Main Navigation Buttons */}
      <div
        className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#F3C92C] scrollbar-track-transparent hover:scrollbar-thumb-[#B4902A]",
          collapsed ? "space-y-2 p-1.5" : "space-y-0.5 p-1.5 sm:p-2 md:p-4"
        )}
      >
        <div className={cn("space-y-0.5", collapsed && "space-y-2")}>
          {mainButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "w-full flex items-center h-auto",
                collapsed
                  ? "px-1 py-2"
                  : "gap-1 sm:gap-1.5 md:gap-2 py-1 sm:py-1.5 md:py-2 px-2",
                "justify-center md:justify-start",
                collapsed && "md:justify-center"
              )}
              onClick={
                button.label === "Cursos" ? handleCoursesClick : button.onClick
              }
            >
              {React.cloneElement(button.icon, {
                className: cn(
                  "shrink-0",
                  collapsed
                    ? "h-4 w-4"
                    : "h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
                ),
              })}
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate">
                    {button.label}
                  </span>
                  {button.extra && <div className="ml-2">{button.extra}</div>}
                </div>
              )}
            </Button>
          ))}
        </div>

        {/* Course List */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            showCourses && !collapsed ? "opacity-100 h-auto" : "opacity-0 h-0"
          )}
        >
          <Separator className="my-1.5 sm:my-2" />
          <CourseList onCourseSelect={handleCourseSelect} />
        </div>
      </div>

      {/* Logout Button */}
      <div
        className={cn("border-t", collapsed ? "p-1.5" : "p-1.5 sm:p-2 md:p-4")}
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center h-auto",
            collapsed
              ? "px-1 py-2"
              : "gap-1 sm:gap-1.5 md:gap-2 py-1 sm:py-1.5 md:py-2 px-2",
            "justify-center md:justify-start",
            collapsed && "md:justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut
            className={cn(
              "shrink-0",
              collapsed ? "h-4 w-4" : "h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
            )}
          />
          {!collapsed && (
            <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate">
              Sair
            </span>
          )}
        </Button>
      </div>

      {/* Menu móvel para cursos */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 z-50 md:hidden animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 h-full w-64 bg-background border-l border-border p-4 shadow-lg animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-foreground">Cursos</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileMenu(false)}
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-4rem)] scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
              <CourseList onCourseSelect={handleCourseSelect} />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
