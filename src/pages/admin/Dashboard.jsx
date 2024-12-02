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
import { supabase } from "../../lib/supabase";
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

        // Buscar total de cursos
        const { count: totalCourses, error: coursesError } = await supabase
          .from("cursos")
          .select("*", { count: "exact", head: true });

        if (coursesError) throw coursesError;

        // Buscar total de módulos
        const { count: totalModules, error: modulesError } = await supabase
          .from("modulos")
          .select("*", { count: "exact", head: true });

        if (modulesError) throw modulesError;

        // Buscar total de vídeos
        const { count: totalVideos, error: videosError } = await supabase
          .from("videoaulas")
          .select("*", { count: "exact", head: true });

        if (videosError) throw videosError;

        // Buscar total de estudantes (usuários com papel 'student')
        const { count: totalStudents, error: studentsError } = await supabase
          .from("perfis")
          .select("*", { count: "exact", head: true })
          .eq("papel", "student");

        if (studentsError) throw studentsError;

        // Buscar total de questões
        const { count: totalQuestions, error: questionsError } = await supabase
          .from("questoes")
          .select("*", { count: "exact", head: true });

        if (questionsError) throw questionsError;

        setStats({
          totalCourses,
          totalModules,
          totalVideos,
          totalStudents,
          totalQuestions,
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
        <StatCard title="Estudantes" value={stats.totalStudents} icon={Users} />
      </div>
    </div>
  );
}
