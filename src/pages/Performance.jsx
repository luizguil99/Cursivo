import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chart } from "@/components/ui/chart";
import { PieChart } from "@/components/ui/pie-chart";
import { LineChart } from "@/components/ui/line-chart";
import Sidebar from "@/components/courses/Sidebar";
import ModulesSidebar from "@/components/courses/ModulesSidebar";
import TopNav from "@/components/TopNav";
import CourseContent from "@/components/courses/CourseContent";

// Dados de exemplo
const studyData = [
  { name: "Segunda", value: 40 },
  { name: "Terça", value: 30 },
  { name: "Quarta", value: 50 },
  { name: "Quinta", value: 20 },
  { name: "Sexta", value: 40 },
  { name: "Sábado", value: 60 },
  { name: "Domingo", value: 30 },
];

const subjectProgress = [
  { name: "Matemática", value: 85 },
  { name: "Português", value: 72 },
  { name: "História", value: 90 },
  { name: "Geografia", value: 68 },
  { name: "Física", value: 75 },
];

const timeDistribution = [
  { name: "Exercícios", value: 35 },
  { name: "Aulas", value: 25 },
  { name: "Leitura", value: 20 },
  { name: "Revisão", value: 15 },
  { name: "Outros", value: 5 },
];

const monthlyProgress = [
  { name: "Jan", value: 65 },
  { name: "Fev", value: 70 },
  { name: "Mar", value: 68 },
  { name: "Abr", value: 75 },
  { name: "Mai", value: 82 },
  { name: "Jun", value: 85 },
];

function Performance() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TopNav />
      <Sidebar onCourseSelect={handleCourseSelect} />
      {selectedCourse && (
        <ModulesSidebar
          course={selectedCourse}
          onSelectLesson={handleLessonSelect}
        />
      )}
      <main className="flex-1 overflow-y-auto">
        {selectedLesson ? (
          <CourseContent lesson={selectedLesson} />
        ) : (
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">Desempenho</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Total de Horas</CardTitle>
                  <CardDescription>Horas estudadas esta semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">27h</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    +2.5% em relação à semana passada
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Exercícios</CardTitle>
                  <CardDescription>Exercícios resolvidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">245</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    +12% em relação à semana passada
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Média Geral</CardTitle>
                  <CardDescription>Média de todas as matérias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">82%</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    +5% em relação à semana passada
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Aulas Assistidas</CardTitle>
                  <CardDescription>Total desta semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    +3 aulas em relação à semana passada
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Progresso Mensal</CardTitle>
                  <CardDescription>Evolução da média geral</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart data={monthlyProgress} />
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Distribuição do Tempo</CardTitle>
                  <CardDescription>
                    Como você distribui seu tempo de estudo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart data={timeDistribution} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Horas de Estudo por Dia</CardTitle>
                  <CardDescription>Últimos 7 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <Chart data={studyData} />
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Progresso por Matéria</CardTitle>
                  <CardDescription>Porcentagem concluída</CardDescription>
                </CardHeader>
                <CardContent>
                  <Chart data={subjectProgress} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Próximas Atividades</CardTitle>
                  <CardDescription>
                    Atividades programadas para esta semana
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        materia: "Matemática",
                        atividade: "Prova de Álgebra",
                        data: "Quarta-feira, 14:00",
                      },
                      {
                        materia: "Português",
                        atividade: "Redação",
                        data: "Quinta-feira, 10:00",
                      },
                      {
                        materia: "História",
                        atividade: "Trabalho em Grupo",
                        data: "Sexta-feira, 16:00",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">{item.materia}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.atividade}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.data}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Medalhas</CardTitle>
                  <CardDescription>Conquistas desta semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        nome: "Super Dedicado",
                        desc: "Estudou 7 dias seguidos",
                      },
                      {
                        nome: "Mestre da Matemática",
                        desc: "100% em 3 exercícios",
                      },
                      { nome: "Participativo", desc: "Respondeu 10 perguntas" },
                    ].map((medalha, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 border-b pb-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          🏆
                        </div>
                        <div>
                          <p className="font-medium">{medalha.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {medalha.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Performance;
