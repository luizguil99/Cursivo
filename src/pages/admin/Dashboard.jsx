import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  VideoIcon,
  GraduationCap,
  Users,
  Folders,
  ListChecks,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalModules: 0,
    totalVideos: 0,
    totalStudents: 0,
    totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Buscar cursos
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Buscar módulos para cada curso
        const modulesData = {};
        for (const course of coursesData) {
          const moduleSnapshot = await getDocs(
            query(collection(db, "modules"), where("courseId", "==", course.id))
          );
          modulesData[course.id] = moduleSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }

        // Buscar vídeos para cada módulo
        const videosData = {};
        for (const course of coursesData) {
          const courseModules = modulesData[course.id] || [];
          for (const module of courseModules) {
            const videoSnapshot = await getDocs(
              query(
                collection(db, "videos"),
                where("moduleId", "==", module.id)
              )
            );
            videosData[module.id] = videoSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
        }

        // Atualizar estatísticas
        const studentsSnapshot = await getDocs(collection(db, "users"));
        const questionsSnapshot = await getDocs(collection(db, "questions"));

        setStats({
          totalCourses: coursesData.length,
          totalModules: Object.values(modulesData).flat().length,
          totalVideos: Object.values(videosData).flat().length,
          totalStudents: studentsSnapshot.docs.length,
          totalQuestions: questionsSnapshot.docs.length,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#F3C92C]" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao painel administrativo do Cursivo
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total de Cursos"
          value={stats.totalCourses}
          icon={GraduationCap}
        />
        <StatCard
          title="Total de Módulos"
          value={stats.totalModules}
          icon={Folders}
        />
        <StatCard
          title="Total de Vídeos"
          value={stats.totalVideos}
          icon={VideoIcon}
        />
        <StatCard
          title="Total de Questões"
          value={stats.totalQuestions}
          icon={ListChecks}
        />
        <StatCard
          title="Estudantes"
          value={stats.totalStudents}
          icon={Users}
        />
      </div>
    </div>
  );
}
