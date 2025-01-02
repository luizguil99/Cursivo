import React, { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Brain, BookOpen, Clock, Trophy } from "lucide-react";

function Performance() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [medalhas, setMedalhas] = useState([]);
  const [exerciciosConcluidos, setExerciciosConcluidos] = useState(0);
  const [exerciciosHoje, setExerciciosHoje] = useState(0);
  const [aulasConcluidas, setAulasConcluidas] = useState(0);
  const [aulasHoje, setAulasHoje] = useState(0);
  const [tempoTotal, setTempoTotal] = useState(0);
  const [tempoHoje, setTempoHoje] = useState(0);
  const [questoesPorAssunto, setQuestoesPorAssunto] = useState({});
  const [questoesAcertadas, setQuestoesAcertadas] = useState(0);
  const [questoesErradas, setQuestoesErradas] = useState(0);
  const [melhorAssunto, setMelhorAssunto] = useState({ assunto: '', acertos: 0 });
  const { currentUser } = useAuth();

  // Buscar medalhas
  useEffect(() => {
    const fetchMedalhas = async () => {
      if (!currentUser?.id) return;
      try {
        const { data, error } = await supabase
          .from("conquistas_usuarios")
          .select(
            `
            id,
            desbloqueado_em,
            conquistas (
              nome,
              descricao,
              icone
            )
          `
          )
          .eq("usuario_id", currentUser.id)
          .order("desbloqueado_em", { ascending: false })
          .limit(3);

        if (error) throw error;
        setMedalhas(data || []);
      } catch (error) {
        console.error("Erro ao buscar medalhas:", error);
      }
    };
    fetchMedalhas();
  }, [currentUser?.id]);

  // Buscar exercícios concluídos
  useEffect(() => {
    const fetchExercicios = async () => {
      if (!currentUser?.id) return;
      try {
        const { data: allQuestions } = await supabase
          .from("questoes_concluidas")
          .select("id, concluido_em")
          .eq("usuario_id", currentUser.id);

        setExerciciosConcluidos(allQuestions?.length || 0);

        // Exercícios de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exerciciosDeHoje = allQuestions?.filter(
          (q) => new Date(q.concluido_em) >= today
        );
        setExerciciosHoje(exerciciosDeHoje?.length || 0);
      } catch (error) {
        console.error("Erro ao buscar exercícios:", error);
      }
    };
    fetchExercicios();
  }, [currentUser?.id]);

  // Buscar aulas concluídas
  useEffect(() => {
    const fetchAulas = async () => {
      if (!currentUser?.id) return;
      try {
        const { data: allLessons } = await supabase
          .from("aulas_concluidas")
          .select("id, concluido_em, tempo_assistido")
          .eq("usuario_id", currentUser.id);

        setAulasConcluidas(allLessons?.length || 0);

        // Aulas de hoje e tempo estudado
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const aulasDeHoje = allLessons?.filter(
          (a) => new Date(a.concluido_em) >= today
        );
        setAulasHoje(aulasDeHoje?.length || 0);

        // Calcular tempo total
        const tempoTotalSegundos = allLessons?.reduce(
          (acc, curr) => acc + (curr.tempo_assistido || 0),
          0
        );
        setTempoTotal(tempoTotalSegundos || 0);

        // Calcular tempo de hoje
        const tempoHojeSegundos = aulasDeHoje?.reduce(
          (acc, curr) => acc + (curr.tempo_assistido || 0),
          0
        );
        setTempoHoje(tempoHojeSegundos || 0);
      } catch (error) {
        console.error("Erro ao buscar aulas:", error);
      }
    };
    fetchAulas();
  }, [currentUser?.id]);

  // Buscar dados das questões
  useEffect(() => {
    const fetchQuestoesData = async () => {
      try {
        const { data: questoesConcluidas, error } = await supabase
          .from("questoes_concluidas")
          .select(`
            id,
            esta_correta,
            concluido_em,
            questao_id,
            questoes (
              assunto,
              topico
            )
          `)
          .eq("usuario_id", currentUser.id);

        if (error) throw error;

        // Contagem de acertos e erros
        const acertos = questoesConcluidas.filter(q => q.esta_correta).length;
        const erros = questoesConcluidas.filter(q => !q.esta_correta).length;
        setQuestoesAcertadas(acertos);
        setQuestoesErradas(erros);

        // Análise por assunto
        const assuntos = {};
        questoesConcluidas.forEach(questao => {
          const assunto = questao.questoes.assunto;
          if (!assuntos[assunto]) {
            assuntos[assunto] = { total: 0, acertos: 0 };
          }
          assuntos[assunto].total++;
          if (questao.esta_correta) {
            assuntos[assunto].acertos++;
          }
        });
        setQuestoesPorAssunto(assuntos);

        // Encontrar melhor assunto
        let melhorAssuntoAtual = { assunto: '', acertos: 0, taxa: 0 };
        Object.entries(assuntos).forEach(([assunto, dados]) => {
          const taxa = (dados.acertos / dados.total) * 100;
          if (taxa > melhorAssuntoAtual.taxa) {
            melhorAssuntoAtual = { 
              assunto, 
              acertos: dados.acertos,
              taxa,
              total: dados.total
            };
          }
        });
        setMelhorAssunto(melhorAssuntoAtual);

      } catch (error) {
        console.error("Erro ao buscar dados das questões:", error);
      }
    };

    if (currentUser) {
      fetchQuestoesData();
    }
  }, [currentUser]);

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
  };

  // Formatar tempo em horas
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    return hours > 0 ? `${hours}h` : "0h";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background to-muted">
      <TopNav />
      <Sidebar onCourseSelect={handleCourseSelect} />
      {selectedCourse && (
        <ModulesSidebar
          course={selectedCourse}
          onSelectLesson={handleLessonSelect}
        />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-bold text-[#F3C92C]">
                Desempenho
              </h2>
              <p className="text-muted-foreground mt-2">
                Acompanhe seu progresso e conquistas
              </p>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Card de Exercícios */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-[#F3C92C]/10">
                    <Brain className="w-5 h-5 text-[#F3C92C]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Exercícios</CardTitle>
                    <CardDescription>
                      {exerciciosHoje > 0
                        ? `+${exerciciosHoje} ${
                            exerciciosHoje === 1 ? "questão" : "questões"
                          } hoje`
                        : "Nenhuma questão hoje"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-[#F3C92C]">
                    {exerciciosConcluidos}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Aulas */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-[#F3C92C]/10">
                    <BookOpen className="w-5 h-5 text-[#F3C92C]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Aulas Concluídas</CardTitle>
                    <CardDescription>
                      {aulasHoje > 0
                        ? `+${aulasHoje} ${
                            aulasHoje === 1 ? "aula" : "aulas"
                          } hoje`
                        : "Nenhuma aula hoje"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-[#F3C92C]">
                    {aulasConcluidas}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Tempo de Estudo */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-[#F3C92C]/10">
                    <Clock className="w-5 h-5 text-[#F3C92C]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Horas Estudadas</CardTitle>
                    <CardDescription>
                      {tempoHoje > 0
                        ? `+${formatTime(tempoHoje)} hoje`
                        : "Nenhum estudo hoje"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-[#F3C92C]">
                    {formatTime(tempoTotal)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Medalhas */}
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-[#F3C92C]/10">
                    <Trophy className="w-5 h-5 text-[#F3C92C]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Medalhas</CardTitle>
                    <CardDescription>Conquistas recentes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  {medalhas.length > 0 ? (
                    medalhas.map((medalha) => (
                      <div
                        key={medalha.id}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#F3C92C]/10 flex items-center justify-center shadow-sm">
                          {medalha.conquistas.icone === "graduation" && "🎓"}
                          {medalha.conquistas.icone === "book" && "📚"}
                          {medalha.conquistas.icone === "trophy" && "🏆"}
                          {medalha.conquistas.icone === "star" && "⭐"}
                          {medalha.conquistas.icone === "target" && "🎯"}
                          {medalha.conquistas.icone === "zap" && "⚡"}
                          {medalha.conquistas.icone === "award" && "🏅"}
                          {medalha.conquistas.icone === "medal" && "🎖️"}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {medalha.conquistas.nome}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {medalha.conquistas.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              medalha.desbloqueado_em
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhuma medalha conquistada ainda</p>
                      <p className="text-xs mt-1">
                        Complete exercícios para ganhar medalhas!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Gráficos */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Gráfico de Exercícios */}
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-muted p-6">
              <h3 className="text-lg font-semibold mb-4">Progresso dos Exercícios</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#F3C92C]/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Acertos</p>
                    <p className="text-2xl font-bold text-[#F3C92C]">{questoesAcertadas}</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Erros</p>
                    <p className="text-2xl font-bold text-red-500">{questoesErradas}</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-blue-500">{questoesAcertadas + questoesErradas}</p>
                  </div>
                </div>

                {melhorAssunto.assunto && (
                  <div className="bg-[#F3C92C]/5 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Melhor Desempenho</h4>
                    <p className="text-lg font-semibold">{melhorAssunto.assunto}</p>
                    <p className="text-sm text-muted-foreground">
                      {melhorAssunto.acertos} acertos de {melhorAssunto.total} questões ({melhorAssunto.taxa.toFixed(1)}%)
                    </p>
                  </div>
                )}

                <div className="h-[200px]">
                  <PieChart
                    data={[
                      { name: "Acertos", value: questoesAcertadas, fill: "#F3C92C" },
                      { name: "Erros", value: questoesErradas, fill: "#EF4444" }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">Desempenho por Assunto</h4>
                  {Object.entries(questoesPorAssunto).map(([assunto, dados]) => (
                    <div key={assunto} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{assunto}</p>
                        <p className="text-sm text-muted-foreground">
                          {((dados.acertos / dados.total) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-[#F3C92C] h-2 rounded-full"
                          style={{ width: `${(dados.acertos / dados.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Gráfico de Aulas */}
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-muted p-6">
              <h3 className="text-lg font-semibold mb-4">Progresso das Aulas</h3>
              <div className="h-[300px]">
                <Chart
                  data={[
                    { name: "Total", value: aulasConcluidas },
                    { name: "Hoje", value: aulasHoje },
                  ]}
                />
              </div>
            </Card>

            {/* Gráfico de Tempo */}
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-muted p-6">
              <h3 className="text-lg font-semibold mb-4">Tempo de Estudo</h3>
              <div className="h-[300px]">
                <PieChart
                  data={[
                    { name: "Total", value: tempoTotal / 3600, fill: "#F3C92C" },
                    { name: "Hoje", value: tempoHoje / 3600, fill: "#FFE17D" },
                  ]}
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Performance;
