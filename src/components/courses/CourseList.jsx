import React, { useState, useEffect, useMemo } from "react";
import CourseListItem from "./CourseListItem";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { courseLessons } from "@/data/courseLessons";

// Cache object to store courses data
const coursesCache = {
  data: null,
  lastFetch: null,
  expirationTime: 5 * 60 * 1000, // 5 minutes in milliseconds
};

function CourseList({ onCourseSelect }) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState(() => coursesCache.data || []);
  const [loading, setLoading] = useState(!coursesCache.data);
  const [error, setError] = useState(null);

  const initializeCoursesIfNeeded = async () => {
    try {
      console.log("Verificando se é necessário inicializar cursos...");

      // Verificar se já existem cursos
      const { data: existingCourses, error: fetchError } = await supabase
        .from("cursos")
        .select("*");

      if (fetchError) throw fetchError;

      if (!existingCourses?.length) {
        console.log("Nenhum curso encontrado, inicializando...");

        // Preparar os cursos para inserção
        const subjects = Object.keys(courseLessons).map((title) => ({
          titulo: title,
          descricao: `Curso de ${title}`,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        }));

        // Inserir os cursos
        const { error: insertError } = await supabase
          .from("cursos")
          .insert(subjects);

        if (insertError) throw insertError;

        console.log("Cursos inicializados com sucesso!");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao inicializar cursos:", error);
      return false;
    }
  };

  // Memoize the fetchCourses function
  const fetchCourses = useMemo(() => async () => {
    // Check if we have valid cached data
    const now = Date.now();
    if (
      coursesCache.data &&
      coursesCache.lastFetch &&
      now - coursesCache.lastFetch < coursesCache.expirationTime
    ) {
      setCourses(coursesCache.data);
      setLoading(false);
      return;
    }

    try {
      // Primeiro, verifica se precisa inicializar os cursos
      await initializeCoursesIfNeeded();

      // Buscar cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from("cursos")
        .select("*");

      if (coursesError) throw coursesError;

      // Buscar progresso do usuário se estiver logado
      if (currentUser) {
        const { data: progressData, error: progressError } = await supabase
          .from("progresso_usuario")
          .select("*")
          .eq("usuario_id", currentUser.id);

        if (progressError) throw progressError;

        // Calcular progresso para cada curso
        const coursesWithProgress = coursesData.map((course) => {
          const userProgress = progressData?.find(
            (p) => p.curso_id === course.id
          );
          return {
            id: course.id,
            name: course.titulo,
            description: course.descricao,
            progress: userProgress?.progresso || 0,
          };
        });

        // Update cache
        coursesCache.data = coursesWithProgress;
        coursesCache.lastFetch = now;

        setCourses(coursesWithProgress);
      } else {
        // Se não estiver logado, mostrar cursos sem progresso
        const coursesWithoutProgress = coursesData.map((course) => ({
          id: course.id,
          name: course.titulo,
          description: course.descricao,
          progress: 0,
        }));

        // Update cache
        coursesCache.data = coursesWithoutProgress;
        coursesCache.lastFetch = now;

        setCourses(coursesWithoutProgress);
      }
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // Only recreate if currentUser changes

  // Fetch courses only when component mounts or currentUser changes
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (error) {
    return (
      <div className="p-4 text-red-500">Erro ao carregar cursos: {error}</div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <nav className="p-2 space-y-1">
      {courses.map((course) => (
        <CourseListItem
          key={course.id}
          course={course}
          onSelect={() => onCourseSelect(course)}
        />
      ))}
    </nav>
  );
}

export default CourseList;
