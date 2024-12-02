import React, { useState, useEffect } from "react";
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
  const [selectedCourse, setSelectedCourse] = useState(
    location.state?.course || null
  );
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

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
                setSelectedModule({
                  id: moduleData.id,
                  title: moduleData.titulo,
                  ...moduleData,
                });

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
        setSelectedModule(null);
        setSelectedLesson(null);
      }
    };

    loadCourseData();
  }, [id, moduleId, lessonId]);

  const handleLessonSelect = (lesson) => {
    console.log("Aula selecionada:", lesson);
    // Formatando os dados da lição para o formato esperado pelo CourseContent
    setSelectedLesson({
      id: lesson.id,
      title: lesson.titulo,
      description: lesson.descricao,
      videoUrl: lesson.url_video,
      resources: lesson.recursos || [],
      ...lesson,
    });
    setShowSchedule(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TopNav />
      <Sidebar
        onCourseSelect={setSelectedCourse}
        onScheduleClick={() => setShowSchedule(true)}
      />
      {selectedCourse && (
        <ModulesSidebar
          course={selectedCourse}
          onSelectLesson={handleLessonSelect}
          selectedModule={selectedModule}
        />
      )}
      <main className="flex-1 overflow-y-auto">
        {showSchedule ? (
          <WeeklySchedule onClose={() => setShowSchedule(false)} />
        ) : (
          <CourseContent lesson={selectedLesson} />
        )}
      </main>
    </div>
  );
}

export default Courses;
