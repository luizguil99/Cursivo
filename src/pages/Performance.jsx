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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { LineChart as LineChartComponent } from "@/components/ui/line-chart";
import Sidebar from "@/components/courses/Sidebar";
import ModulesSidebar from "@/components/courses/ModulesSidebar";
import TopNav from "@/components/TopNav";
import CourseContent from "@/components/courses/CourseContent";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Brain, BookOpen, Clock, Trophy, Play } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
  const [tempoMedioAula, setTempoMedioAula] = useState(0);
  const [aulasMaisLongas, setAulasMaisLongas] = useState([]);
  const [questoesPorAssunto, setQuestoesPorAssunto] = useState({});
  const [questoesAcertadas, setQuestoesAcertadas] = useState(0);
  const [questoesErradas, setQuestoesErradas] = useState(0);
  const [melhorAssunto, setMelhorAssunto] = useState({
    assunto: "",
    acertos: 0,
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [dadosTempoMensal, setDadosTempoMensal] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [showCourses, setShowCourses] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [moduleSidebarCollapsed, setModuleSidebarCollapsed] = useState(false);

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
        const { data: allLessons, error } = await supabase
          .from("aulas_concluidas")
          .select(
            `
            id,
            concluido_em,
            tempo_assistido,
            videoaula_id,
            videoaulas (
              titulo
            )
          `
          )
          .eq("usuario_id", currentUser.id);

        if (error) throw error;

        // Processar dados mensais
        const processarDadosMensais = (aulas) => {
          const dadosPorMes = {};

          aulas?.forEach((aula) => {
            const data = new Date(aula.concluido_em);
            const mesAno = format(data, "MMM/yy", { locale: ptBR });

            if (!dadosPorMes[mesAno]) {
              dadosPorMes[mesAno] = 0;
            }
            dadosPorMes[mesAno] += aula.tempo_assistido || 0;
          });

          // Converter para array e ordenar por data
          const dadosOrdenados = Object.entries(dadosPorMes)
            .map(([mes, tempo]) => ({
              mes,
              horas: Number((tempo / 3600).toFixed(1)),
            }))
            .sort((a, b) => {
              const [mesA, anoA] = a.mes.split("/");
              const [mesB, anoB] = b.mes.split("/");
              return (
                new Date(`${anoA}-${mesA}-01`) - new Date(`${anoB}-${mesB}-01`)
              );
            });

          setDadosTempoMensal(dadosOrdenados);
        };

        processarDadosMensais(allLessons);

        // Filtrar por data ou intervalo
        const aulasFiltradas = filterByDateRange(allLessons);
        setAulasConcluidas(aulasFiltradas?.length || 0);

        // Calcular tempo total
        const tempoTotalSegundos = aulasFiltradas?.reduce(
          (acc, curr) => acc + (curr.tempo_assistido || 0),
          0
        );
        setTempoTotal(tempoTotalSegundos || 0);

        // Tempo médio por aula
        if (aulasFiltradas?.length > 0) {
          const media = tempoTotalSegundos / aulasFiltradas.length;
          setTempoMedioAula(media);
        }

        // Aulas mais longas
        const aulasOrdenadas = [...(aulasFiltradas || [])]
          .sort((a, b) => (b.tempo_assistido || 0) - (a.tempo_assistido || 0))
          .slice(0, 3);
        setAulasMaisLongas(aulasOrdenadas);
      } catch (error) {
        console.error("Erro ao buscar aulas:", error);
      }
    };

    fetchAulas();
  }, [currentUser?.id, dateRange]);

  // Buscar dados das questões
  useEffect(() => {
    const fetchQuestoes = async () => {
      if (!currentUser?.id) return;
      try {
        const { data: questoesConcluidas, error } = await supabase
          .from("questoes_concluidas")
          .select(
            `
            id,
            esta_correta,
            concluido_em,
            questoes (
              assunto,
              topico
            )
          `
          )
          .eq("usuario_id", currentUser.id);

        if (error) throw error;

        // Filtrar por data ou intervalo
        const questoesFiltradas = filterByDateRange(questoesConcluidas);

        // Contagem de acertos e erros
        const acertos = questoesFiltradas.filter((q) => q.esta_correta).length;
        const erros = questoesFiltradas.filter((q) => !q.esta_correta).length;
        setQuestoesAcertadas(acertos);
        setQuestoesErradas(erros);

        // Calcular questões por assunto
        const assuntos = {};
        questoesFiltradas.forEach((questao) => {
          const assunto = questao.questoes.assunto;
          if (!assuntos[assunto]) {
            assuntos[assunto] = { total: 0, acertos: 0 };
          }
          assuntos[assunto].total += 1;
          if (questao.esta_correta) {
            assuntos[assunto].acertos += 1;
          }
        });
        setQuestoesPorAssunto(assuntos);

        // Encontrar melhor assunto
        let melhorAssuntoAtual = { assunto: "", acertos: 0, taxa: 0 };
        Object.entries(assuntos).forEach(([assunto, dados]) => {
          const taxa = (dados.acertos / dados.total) * 100;
          if (taxa > melhorAssuntoAtual.taxa) {
            melhorAssuntoAtual = {
              assunto,
              acertos: dados.acertos,
              total: dados.total,
              taxa,
            };
          }
        });
        setMelhorAssunto(melhorAssuntoAtual);
      } catch (error) {
        console.error("Erro ao buscar dados das questões:", error);
      }
    };

    fetchQuestoes();
  }, [currentUser?.id, dateRange]);

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
  };

  // Função para filtrar dados por intervalo
  const filterByDateRange = (data) => {
    const startOfDay = new Date(dateRange.from);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateRange.to);
    endOfDay.setHours(23, 59, 59, 999);

    return data?.filter((item) => {
      const itemDate = new Date(item.concluido_em);
      return itemDate >= startOfDay && itemDate <= endOfDay;
    });
  };

  // Formatar tempo em horas
  const formatTime = (seconds) => {
    if (!seconds) return "0min 0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background to-muted">
      <TopNav />
      <Sidebar
        onCourseSelect={handleCourseSelect}
        onScheduleClick={() =>
          navigate("/courses", { state: { showSchedule: true } })
        }
        onModuleSidebarToggle={(collapsed) =>
          setModuleSidebarCollapsed(collapsed)
        }
        showCourses={showCourses}
        setShowCourses={setShowCourses}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        showSchedule={showSchedule}
      />
      {selectedCourse && (
        <ModulesSidebar
          course={selectedCourse}
          onTopicSelect={handleLessonSelect}
          collapsed={moduleSidebarCollapsed}
          setCollapsed={setModuleSidebarCollapsed}
          onUpdateCompletion={() => {}}
        />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F3C92C]">
                Desempenho
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Acompanhe seu progresso e conquistas
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto flex items-center gap-2 text-xs sm:text-sm"
                >
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} -{" "}
                      {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    "Selecione o período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="center"
                side="bottom"
              >
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (!range?.from) {
                      setDateRange({ from: new Date(), to: new Date() });
                    } else if (range.from && !range.to) {
                      setDateRange({ from: range.from, to: range.from });
                    } else {
                      setDateRange(range);
                    }
                  }}
                  numberOfMonths={1}
                  className="w-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
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
              <h3 className="text-lg font-semibold mb-4">
                Progresso dos Exercícios
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#F3C92C]/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Acertos</p>
                    <p className="text-2xl font-bold text-[#F3C92C]">
                      {questoesAcertadas}
                    </p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Erros</p>
                    <p className="text-2xl font-bold text-red-500">
                      {questoesErradas}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {questoesAcertadas + questoesErradas}
                    </p>
                  </div>
                </div>

                {melhorAssunto.assunto && (
                  <div className="bg-[#F3C92C]/5 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Melhor Desempenho
                    </h4>
                    <p className="text-lg font-semibold">
                      {melhorAssunto.assunto}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {melhorAssunto.acertos} acertos de {melhorAssunto.total}{" "}
                      questões ({melhorAssunto.taxa.toFixed(1)}%)
                    </p>
                  </div>
                )}

                <div className="h-[120px] sm:h-[200px] relative px-8 sm:px-0">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <p className="text-sm font-medium text-[#F3C92C]">
                      Acertos{" "}
                      {(
                        (questoesAcertadas /
                          (questoesAcertadas + questoesErradas)) *
                        100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Erros{" "}
                      {(
                        (questoesErradas /
                          (questoesAcertadas + questoesErradas)) *
                        100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                  <PieChart
                    data={[
                      {
                        name: "Acertos",
                        value: questoesAcertadas || 1,
                        fill: "#F3C92C",
                      },
                      {
                        name: "Erros",
                        value: questoesErradas || 0,
                        fill: "#F4F4F5",
                      },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-2">
                    Desempenho por Assunto
                  </h4>
                  {Object.entries(questoesPorAssunto).map(
                    ([assunto, dados]) => (
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
                            style={{
                              width: `${(dados.acertos / dados.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </Card>

            {/* Gráfico de Aulas */}
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-muted p-6">
              <h3 className="text-lg font-semibold mb-4">
                Estatísticas de Aulas
              </h3>

              {aulasConcluidas > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F3C92C]/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Aulas Concluídas
                      </p>
                      <div className="mt-1 flex items-baseline">
                        <p className="text-2xl font-bold text-[#F3C92C]">
                          {aulasConcluidas}
                        </p>
                        {aulasHoje > 0 && (
                          <p className="ml-2 text-sm text-[#F3C92C]/80">
                            +{aulasHoje} hoje
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#F3C92C]/10 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        Tempo Total
                      </p>
                      <div className="mt-1 flex items-baseline">
                        <p className="text-2xl font-bold text-[#F3C92C]">
                          {formatTime(tempoTotal)}
                        </p>
                        {tempoHoje > 0 && (
                          <p className="ml-2 text-sm text-[#F3C92C]/80">
                            +{formatTime(tempoHoje)} hoje
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F3C92C]/5 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">
                        Tempo Médio por Aula
                      </h4>
                      <p className="text-lg font-semibold text-[#F3C92C]">
                        {formatTime(tempoMedioAula)}
                      </p>
                    </div>
                  </div>

                  {aulasMaisLongas.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Aulas Mais Longas</h4>
                      {aulasMaisLongas.map((aula) => (
                        <div
                          key={aula.id}
                          className="bg-muted/50 rounded-lg p-3"
                        >
                          <p className="text-sm font-medium line-clamp-1">
                            {aula.videoaulas.titulo}
                          </p>
                          <div className="flex items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                              Tempo assistido:{" "}
                              {formatTime(aula.tempo_assistido)}
                            </p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                            <div
                              className="bg-[#F3C92C] h-1.5 rounded-full"
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-[#F3C92C]/10 rounded-full p-4 mb-4">
                    <Play className="w-8 h-8 text-[#F3C92C]" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">
                    Nenhuma aula assistida
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Comece a assistir as aulas para ver suas estatísticas de
                    progresso
                  </p>
                </div>
              )}
            </Card>

            {/* Gráfico de Tempo de Estudo por Mês */}
            <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-muted p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">
                    Tempo de Estudo por Mês
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Total: {formatTime(tempoTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-[#F3C92C]" />
                    <span className="text-muted-foreground">
                      Horas estudadas
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[250px] sm:h-[300px] -mx-4 sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dadosTempoMensal}
                    margin={{
                      top: 5,
                      right: 20,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="horasGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#F3C92C"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F3C92C"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="mes"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      padding={{ left: 10, right: 10 }}
                      tick={{ transform: "translate(0, 8)" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}h`}
                      padding={{ top: 20 }}
                      width={30}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2 sm:p-3 shadow-lg">
                              <p className="text-xs sm:text-sm font-semibold mb-1">
                                {payload[0].payload.mes}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#F3C92C]" />
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {payload[0].value} horas estudadas
                                </p>
                              </div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                {Math.round(payload[0].value * 60)} minutos
                                totais
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="horas"
                      stroke="#F3C92C"
                      strokeWidth={2}
                      dot={{
                        fill: "#F3C92C",
                        strokeWidth: 2,
                        r: 3,
                        strokeDasharray: "",
                      }}
                      activeDot={{
                        fill: "#F3C92C",
                        strokeWidth: 2,
                        r: 4,
                        strokeDasharray: "",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="horas"
                      stroke="false"
                      fillOpacity={1}
                      fill="url(#horasGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-[#F3C92C]/10 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Média Mensal
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-[#F3C92C]">
                    {dadosTempoMensal.length > 0
                      ? (
                          dadosTempoMensal.reduce(
                            (acc, curr) => acc + curr.horas,
                            0
                          ) / dadosTempoMensal.length
                        ).toFixed(1)
                      : 0}
                    h
                  </p>
                </div>
                <div className="bg-[#F3C92C]/10 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Melhor Mês
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-[#F3C92C]">
                    {dadosTempoMensal.length > 0
                      ? Math.max(...dadosTempoMensal.map((d) => d.horas))
                      : 0}
                    h
                  </p>
                </div>
                <div className="bg-[#F3C92C]/10 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de Meses
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-[#F3C92C]">
                    {dadosTempoMensal.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Performance;
