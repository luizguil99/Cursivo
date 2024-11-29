import React, { useState, useEffect } from "react";
import CourseListItem from "./CourseListItem";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { courseLessons } from "@/data/courseLessons";

const staticCourses = [
  {
    id: "1",
    name: "Artes",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500",
  },
  {
    id: "2",
    name: "Biologia",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500",
  },
  {
    id: "3",
    name: "Educação Física",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=500",
  },
  {
    id: "4",
    name: "Filosofia",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1555959910-83e0d5c0ca8c?w=500",
  },
  {
    id: "5",
    name: "Física",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500",
  },
  {
    id: "6",
    name: "Geografia",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500",
  },
  {
    id: "7",
    name: "História",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=500",
  },
  {
    id: "8",
    name: "Língua Estrangeira",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1546017847-93abdf8bc6a4?w=500",
  },
  {
    id: "9",
    name: "Língua Portuguesa",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500",
  },
  {
    id: "10",
    name: "Literatura",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=500",
  },
  {
    id: "11",
    name: "Matemática",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500",
  },
  {
    id: "12",
    name: "Química",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=500",
  },
  {
    id: "13",
    name: "Redação",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500",
  },
  {
    id: "14",
    name: "Sociologia",
    progress: 0,
    icon: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500",
  },
];

function CourseList({ onCourseSelect }) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState(staticCourses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeCoursesIfNeeded = async () => {
    try {
      console.log("Verificando se é necessário inicializar cursos...");
      const coursesRef = collection(db, "courses");
      const snapshot = await getDocs(coursesRef);

      if (snapshot.empty) {
        console.log("Nenhum curso encontrado, inicializando...");
        const subjects = Object.keys(courseLessons).map((title) => ({
          title,
          lessons: Object.keys(courseLessons[title] || {}).length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        for (const subject of subjects) {
          try {
            await addDoc(coursesRef, subject);
            console.log(`Matéria ${subject.title} adicionada com sucesso!`);
          } catch (error) {
            console.error(`Erro ao adicionar matéria ${subject.title}:`, error);
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao inicializar cursos:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log("Iniciando busca de cursos...");

        // Primeiro, verifica se precisa inicializar os cursos
        await initializeCoursesIfNeeded();

        // Agora busca os cursos
        const coursesRef = collection(db, "courses");
        const querySnapshot = await getDocs(coursesRef);
        console.log(
          "Snapshot recebido, quantidade de docs:",
          querySnapshot.size
        );

        const coursesData = querySnapshot.docs.map((doc) => {
          console.log("Processando documento:", doc.id, doc.data());
          return {
            id: doc.id,
            name: doc.data().title, // Ajustando o campo title para name
            ...doc.data(),
            progress: 0,
          };
        });

        console.log("Cursos carregados do Firebase:", coursesData);

        // Buscar progresso do usuário
        if (currentUser) {
          console.log("Buscando progresso para usuário:", currentUser.uid);
          const progressRef = collection(db, "userProgress");
          const progressSnapshot = await getDocs(progressRef);

          coursesData.forEach((course) => {
            const userProgress = progressSnapshot.docs.find(
              (doc) => doc.id === `${currentUser.uid}_${course.id}`
            );

            if (userProgress) {
              const completedLessons = Object.keys(
                userProgress.data().completedLessons || {}
              ).length;
              const totalLessons = course.lessons || 0;
              course.progress =
                totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
              console.log(
                `Progresso do curso ${course.name}:`,
                course.progress
              );
            }
          });
        }

        console.log("Atualizando estado com cursos:", coursesData);
        setCourses(coursesData.length > 0 ? coursesData : staticCourses);
      } catch (error) {
        console.error("Erro ao buscar cursos:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [currentUser]);

  if (error) {
    return (
      <div className="p-4 text-red-500">Erro ao carregar cursos: {error}</div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
