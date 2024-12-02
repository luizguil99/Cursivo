import React, { useState, useEffect } from "react";
import { ChevronRight, Brain, PlayCircle } from "lucide-react";
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

// Skeleton component for module titles
const ModuleTitleSkeleton = () => (
  <span className="animate-pulse bg-gray-300 rounded h-4 w-24 inline-block"></span>
);

function ModulesSidebar({ course, onSelectLesson }) {
  const navigate = useNavigate();
  const [showPractice, setShowPractice] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [modules, setModules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCourse, setCurrentCourse] = useState(course);

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

  // Organizar vídeos por módulo e ordenar por ordem
  const videosByModule = modules.reduce((acc, module) => {
    acc[module.id] = videos
      .filter((video) => video.modulo_id === module.id)
      .sort((a, b) => (a.ordem_indice || 0) - (b.ordem_indice || 0));
    return acc;
  }, {});

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
      <aside className="w-72 h-screen border-r bg-card flex flex-col">
        <div className="flex items-center p-4 h-14">
          <h2 className="text-lg font-semibold truncate">
            {currentCourse?.name || currentCourse?.title}
          </h2>
        </div>
        <Separator />

        {/* Practice Button */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 mb-2"
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
            <Brain className="h-4 w-4" />
            Praticar Todos os Tópicos
          </Button>
        </div>
        <Separator />

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto">
          <Accordion type="single" collapsible className="w-full">
            {modules.length === 0 && loading
              ? [...Array(3)].map((_, index) => (
                  <AccordionItem key={index} value={`skeleton-${index}`}>
                    <AccordionTrigger className="hover:bg-accent hover:no-underline px-4">
                      <ModuleTitleSkeleton />
                    </AccordionTrigger>
                  </AccordionItem>
                ))
              : modules.map((module) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="hover:bg-accent hover:no-underline px-4">
                      <span className="text-sm font-medium">{module.titulo}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 p-1">
                        {videosByModule[module.id]?.map((video) => (
                          <Button
                            key={video.id}
                            variant="ghost"
                            className="w-full justify-start gap-2 h-auto py-2 px-4 font-normal"
                            onClick={() => handleLessonSelect(video, module)}
                          >
                            <PlayCircle className="h-4 w-4 shrink-0" />
                            <span className="truncate text-sm">{video.titulo}</span>
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
