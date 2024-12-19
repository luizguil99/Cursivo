import React, { useState, useEffect } from "react";
import { ChevronRight, Brain, PlayCircle, ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PracticeModal from "./PracticeModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Skeleton component for module titles
const ModuleTitleSkeleton = () => (
  <span className="animate-pulse bg-gray-300 rounded h-4 w-24 inline-block"></span>
);

function ModulesSidebar({ course, onSelectLesson }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showPractice, setShowPractice] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [modules, setModules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCourse, setCurrentCourse] = useState(course);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentCourse(course);
  }, [course]);

  useEffect(() => {
    const fetchModulesAndLessons = async () => {
      if (!course?.id) return;

      try {
        console.log("Buscando módulos e aulas para o curso:", course.id);

        // Buscar módulos do curso
        const { data: modulesData, error: modulesError } = await supabase
          .from("modulos")
          .select("*")
          .eq("curso_id", course.id)
          .order("ordem_indice", { ascending: true });

        if (modulesError) throw modulesError;

        console.log("Módulos encontrados:", modulesData);
        setModules(modulesData);

        // Buscar vídeos do curso
        const { data: videosData, error: videosError } = await supabase
          .from("videoaulas")
          .select("*")
          .in(
            "modulo_id",
            modulesData.map((m) => m.id)
          )
          .order("ordem_indice", { ascending: true });

        if (videosError) throw videosError;

        console.log("Vídeos encontrados:", videosData);
        setVideos(videosData);
      } catch (error) {
        console.error("Erro ao buscar módulos e aulas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModulesAndLessons();
  }, [course?.id]);

  useEffect(() => {
    const fetchCompletedLessons = async () => {
      console.log("=== DEBUG DO USUÁRIO NO MODULESSIDEBAR ===");
      console.log("currentUser:", currentUser);
      if (currentUser) {
        console.log("ID:", currentUser.id);
        console.log("Email:", currentUser.email);
      } else {
        console.log("Nenhum usuário logado no ModulesSidebar");
      }
      console.log("=====================================");

      if (!currentUser) return;

      try {
        console.log("=== BUSCANDO AULAS CONCLUÍDAS ===");
        console.log("Usuário ID:", currentUser.id);

        const { data, error } = await supabase
          .from("aulas_concluidas")
          .select(
            `
            videoaula_id,
            videoaulas (
              id,
              titulo
            )
          `
          )
          .eq("usuario_id", currentUser.id);

        if (error) {
          console.error("Erro ao buscar aulas concluídas:", error.message);
          throw error;
        }

        console.log("=== AULAS CONCLUÍDAS ENCONTRADAS ===");
        data.forEach((item) => {
          console.log(`- Aula ID: ${item.videoaula_id}`);
          console.log(
            `  Título: ${item.videoaulas?.titulo || "Título não encontrado"}`
          );
          console.log("-----------------------------------");
        });

        console.log("Aulas concluídas encontradas:", data);
        const completedIds = data.map((item) => item.videoaula_id);
        console.log("IDs das aulas concluídas:", completedIds);

        setCompletedLessons(completedIds);
      } catch (error) {
        console.error("Erro ao buscar aulas concluídas:", error);
      }
    };

    fetchCompletedLessons();
  }, [currentUser]);

  // Organizar vídeos por módulo e ordenar por ordem
  const videosByModule = modules.reduce((acc, module) => {
    acc[module.id] = videos
      .filter((video) => video.modulo_id === module.id)
      .sort((a, b) => (a.ordem_indice || 0) - (b.ordem_indice || 0));
    return acc;
  }, {});

  // Função para verificar se uma aula foi concluída
  const isLessonCompleted = (videoId) => {
    return completedLessons.includes(videoId);
  };

  const handleLessonSelect = (video, module) => {
    onSelectLesson(video);
    // Atualizar a URL com os IDs do curso, módulo e vídeo
    navigate(`/courses/${course.id}/module/${module.id}/lesson/${video.id}`, {
      replace: true,
    });
  };

  if (!course) return null;

  return (
    <>
      <aside
        className={cn(
          "h-screen border-r bg-card flex flex-col transition-all duration-300",
          isMobile ? (collapsed ? "w-12" : "w-44") : "w-72"
        )}
      >
        <div className="flex items-center justify-between p-2 h-10 sm:h-12 md:h-14 border-b">
          {(!isMobile || !collapsed) && (
            <h2 className="text-sm sm:text-base md:text-lg font-semibold truncate">
              {currentCourse?.name || currentCourse?.title}
            </h2>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 md:hidden"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  collapsed && "rotate-180"
                )}
              />
            </Button>
          )}
        </div>

        {/* Practice Button */}
        <div className="p-1.5 sm:p-2 md:p-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm py-1 sm:py-1.5 md:py-2"
            onClick={() => {
              setSelectedTopic(null);
              setShowPractice(true);
            }}
            style={{
              background:
                "linear-gradient(90deg, #B4902A -158.27%, #F3C92C 108.81%)",
              border: "none",
              color: "white",
            }}
          >
            <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            {(!isMobile || !collapsed) && (
              <span className="truncate">
                {isMobile ? "Praticar" : "Praticar Todos os Tópicos"}
              </span>
            )}
          </Button>
        </div>
        <Separator />

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto">
          <Accordion type="single" collapsible className="w-full">
            {modules.length === 0 && loading
              ? [...Array(3)].map((_, index) => (
                  <AccordionItem key={index} value={`skeleton-${index}`}>
                    <AccordionTrigger className="hover:bg-accent hover:no-underline px-2 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm">
                      {(!isMobile || !collapsed) && <ModuleTitleSkeleton />}
                    </AccordionTrigger>
                  </AccordionItem>
                ))
              : modules.map((module) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger
                      className={cn(
                        "hover:bg-accent hover:no-underline py-1.5 sm:py-2 md:py-3",
                        isMobile && collapsed ? "px-1" : "px-2"
                      )}
                    >
                      {isMobile && collapsed ? (
                        <span className="w-6 h-6 flex items-center justify-center text-[10px] font-medium">
                          {module.ordem_indice}
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                          {module.titulo}
                        </span>
                      )}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-0.5 p-0.5">
                        {videosByModule[module.id]?.map((video) => (
                          <Button
                            key={video.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-auto font-normal relative",
                              isMobile && collapsed
                                ? "px-1 py-1"
                                : "gap-1 sm:gap-1.5 md:gap-2 py-1 sm:py-1.5 md:py-2 px-2"
                            )}
                            onClick={() => handleLessonSelect(video, module)}
                          >
                            <PlayCircle
                              className={cn(
                                "shrink-0",
                                isMobile && collapsed
                                  ? "h-4 w-4"
                                  : "h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4"
                              )}
                            />
                            {(!isMobile || !collapsed) && (
                              <span className="truncate text-[10px] sm:text-xs md:text-sm">
                                {video.titulo}
                              </span>
                            )}
                            {isLessonCompleted(video.id) && (
                              <div
                                className={cn(
                                  "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-[#F3C92C]",
                                  isMobile && collapsed
                                    ? "w-1.5 h-1.5"
                                    : "right-1 sm:right-1.5 md:right-2 w-1 sm:w-1.5 md:w-2 h-1 sm:h-1.5 md:h-2"
                                )}
                                title="Aula concluída"
                              />
                            )}
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
          </Accordion>
        </div>
      </aside>

      {/* Practice Modal */}
      {showPractice && (
        <PracticeModal
          onClose={() => setShowPractice(false)}
          course={currentCourse}
          topic={selectedTopic}
        />
      )}
    </>
  );
}

export default ModulesSidebar;
