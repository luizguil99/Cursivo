import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import Sidebar from "@/components/courses/Sidebar";
import ModulesSidebar from "@/components/courses/ModulesSidebar";
import CourseContent from "@/components/courses/CourseContent";
import WeeklySchedule from "@/components/schedule/WeeklySchedule";
import TopNav from "@/components/TopNav";
import { supabase } from "../lib/supabase";

function Courses() {
  const location = useLocation();
  const { id, moduleId, lessonId } = useParams();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [moduleSidebarCollapsed, setModuleSidebarCollapsed] = useState(false);
  const [updateSidebarCompletion, setUpdateSidebarCompletion] = useState(null);

  useEffect(() => {
    const loadCourseData = async () => {
      if (id) {
        try {
          // Carregar dados do curso
          const { data: courseData, error: courseError } = await supabase
            .from("cursos")
            .select("*")
            .eq("id", id)
            .single();

          if (courseError) throw courseError;
          if (courseData) {
            setSelectedCourse({
              id: courseData.id,
              name: courseData.titulo, // Usando titulo como name para compatibilidade
              ...courseData,
            });

            // Se tiver moduleId, carregar o módulo
            if (moduleId) {
              const { data: moduleData, error: moduleError } = await supabase
                .from("modulos")
                .select("*")
                .eq("id", moduleId)
                .single();

              if (moduleError) throw moduleError;
              if (moduleData) {
                // setSelectedModule({
                //   id: moduleData.id,
                //   title: moduleData.titulo,
                //   ...moduleData,
                // });

                // Se tiver lessonId, carregar a lição
                if (lessonId) {
                  const { data: lessonData, error: lessonError } =
                    await supabase
                      .from("videoaulas")
                      .select("*")
                      .eq("id", lessonId)
                      .single();

                  if (lessonError) throw lessonError;
                  if (lessonData) {
                    console.log("Dados da videoaula carregados:", lessonData);
                    setSelectedLesson({
                      id: lessonData.id,
                      title: lessonData.titulo,
                      description: lessonData.descricao,
                      videoUrl: lessonData.url_video,
                      resources: lessonData.recursos || [],
                      ...lessonData,
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        }
      } else {
        // Reset states when there's no ID in the URL
        setSelectedCourse(null);
        setSelectedLesson(null);
      }
    };

    loadCourseData();
  }, [id, moduleId, lessonId]);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    // Abre o ModulesSidebar quando um curso é selecionado
    setModuleSidebarCollapsed(false);
  };

  const handleLessonSelect = (lesson) => {
    console.log("Aula selecionada:", lesson);
    // Formatando os dados da lição para o formato esperado pelo CourseContent
    const formattedLesson = {
      id: lesson.id,
      title: lesson.titulo || lesson.title,
      description: lesson.descricao || lesson.description,
      videoUrl: lesson.url_video || lesson.videoUrl,
      modulo_id: lesson.modulo_id,
      module_titulo: lesson.module_titulo,
      resources: lesson.recursos || lesson.resources || [],
      ...lesson,
    };
    console.log("Aula formatada:", formattedLesson);
    setSelectedLesson(formattedLesson);
    setShowSchedule(false);
  };

  // Função para atualizar a conclusão na sidebar
  const handleUpdateSidebarCompletion = useCallback((updateFn) => {
    setUpdateSidebarCompletion(() => updateFn);
  }, []);

  // Função para buscar a próxima aula
  const getNextLesson = async (currentLesson) => {
    if (!currentLesson?.modulo_id) return null;

    try {
      console.log("Buscando próxima aula no módulo:", currentLesson.modulo_id);

      // Busca todas as aulas do módulo atual ordenadas por ordem_indice
      const { data: moduleVideos } = await supabase
        .from("videoaulas")
        .select("*")
        .eq("modulo_id", currentLesson.modulo_id)
        .order("ordem_indice", { ascending: true });

      if (!moduleVideos?.length) return null;

      // Encontra o índice da aula atual
      const currentIndex = moduleVideos.findIndex(
        (video) => video.id === currentLesson.id
      );
      console.log(
        "Índice atual:",
        currentIndex,
        "Total de aulas:",
        moduleVideos.length
      );

      // Se houver uma próxima aula no módulo atual, retorna ela
      if (currentIndex > -1 && currentIndex < moduleVideos.length - 1) {
        console.log("Próxima aula encontrada no mesmo módulo");
        return moduleVideos[currentIndex + 1];
      }

      // Se não houver mais aulas no módulo atual, busca o próximo módulo
      console.log("Buscando próximo módulo");
      const { data: currentModule } = await supabase
        .from("modulos")
        .select("*")
        .eq("id", currentLesson.modulo_id)
        .single();

      if (!currentModule) return null;

      const { data: nextModule } = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", currentModule.curso_id)
        .gt("ordem_indice", currentModule.ordem_indice)
        .order("ordem_indice")
        .limit(1)
        .single();

      if (nextModule) {
        // Busca a primeira aula do próximo módulo
        const { data: firstLessonNextModule } = await supabase
          .from("videoaulas")
          .select("*")
          .eq("modulo_id", nextModule.id)
          .order("ordem_indice")
          .limit(1)
          .single();

        console.log("Primeira aula do próximo módulo:", firstLessonNextModule);
        return firstLessonNextModule;
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar próxima aula:", error);
      return null;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <TopNav />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onCourseSelect={handleCourseSelect}
          onScheduleClick={() => setShowSchedule(!showSchedule)}
        />
        {selectedCourse && (
          <ModulesSidebar
            course={selectedCourse}
            onTopicSelect={handleLessonSelect}
            collapsed={moduleSidebarCollapsed}
            setCollapsed={setModuleSidebarCollapsed}
            onUpdateCompletion={handleUpdateSidebarCompletion}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          {showSchedule ? (
            <WeeklySchedule onClose={() => setShowSchedule(false)} />
          ) : (
            <CourseContent
              lesson={selectedLesson}
              updateSidebarCompletion={updateSidebarCompletion}
              onVideoEnd={async () => {
                // Atualizar a bolinha na sidebar imediatamente
                if (updateSidebarCompletion) {
                  updateSidebarCompletion(selectedLesson.id, true);
                }

                // Buscar a próxima aula antes de marcar como concluída
                const nextLesson = await getNextLesson(selectedLesson);

                // Navegar para a próxima aula se existir
                if (nextLesson) {
                  handleLessonSelect(nextLesson);
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Courses;
