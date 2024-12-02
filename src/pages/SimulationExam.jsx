import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Scissors,
  X,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/layouts/TopNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { calculateDetailedStats } from "@/utils/triCalculator";
import AIChatWrapper from "@/components/courses/AIChatWrapper";
import ReactDOM from "react-dom/client";

const mockSimulations = {
  1: {
    id: "1",
    title: "Simulado ENEM Completo",
    description:
      "Simulado completo com questões de todas as áreas do conhecimento do ENEM",
    duration: 180,
    questions: [
      {
        question:
          "Em um experimento, um cientista observou que uma determinada bactéria dobrava sua população a cada 20 minutos. Se inicialmente havia 100 bactérias, após 1 hora, quantas bactérias havia aproximadamente?",
        options: [
          "400 bactérias",
          "800 bactérias",
          "1.600 bactérias",
          "3.200 bactérias",
          "6.400 bactérias",
        ],
        correctAnswer: 2,
        difficulty: "MEDIUM",
      },
      {
        question:
          "A fotossíntese é um processo fundamental para a vida na Terra. Sobre esse processo, é correto afirmar que:",
        options: [
          "Libera gás carbônico e consome oxigênio",
          "Ocorre apenas em plantas de cor verde",
          "Transforma energia luminosa em energia química",
          "É um processo exclusivo de plantas terrestres",
          "Acontece apenas durante a noite",
        ],
        correctAnswer: 2,
        difficulty: "EASY",
      },
      {
        question: "O movimento modernista no Brasil teve como marco inicial:",
        options: [
          "A publicação de 'Os Sertões' de Euclides da Cunha",
          "A Semana de Arte Moderna de 1922",
          "A publicação de 'Macunaíma' de Mário de Andrade",
          "O manifesto antropofágico de Oswald de Andrade",
          "A publicação de 'Casa Grande & Senzala'",
        ],
        correctAnswer: 1,
        difficulty: "HARD",
      },
    ],
  },
  2: {
    id: "2",
    title: "Simulado de Matemática",
    description: "Simulado focado em questões de matemática do ENEM",
    duration: 90,
    questions: [
      {
        question: "Se 2x + 3 = 11, então x é igual a:",
        options: ["2", "3", "4", "5", "6"],
        correctAnswer: 3,
        difficulty: "EASY",
      },
      {
        question: "Qual é a área de um quadrado com lado medindo 5 metros?",
        options: ["10 m²", "15 m²", "20 m²", "25 m²", "30 m²"],
        correctAnswer: 3,
        difficulty: "EASY",
      },
    ],
  },
  3: {
    id: "3",
    title: "Simulado de Linguagens",
    description: "Simulado com questões de português, literatura e inglês",
    duration: 90,
    questions: [
      {
        question:
          "Qual é a função sintática do termo sublinhado em: 'O aluno estudioso passou no vestibular'?",
        options: [
          "Sujeito",
          "Predicado",
          "Objeto direto",
          "Adjunto adnominal",
          "Complemento nominal",
        ],
        correctAnswer: 3,
        difficulty: "MEDIUM",
      },
      {
        question:
          "Choose the correct form: 'If I _____ rich, I _____ travel around the world.'",
        options: [
          "was / would",
          "were / would",
          "am / will",
          "were / will",
          "was / will",
        ],
        correctAnswer: 1,
        difficulty: "HARD",
      },
    ],
  },
};

function SimulationExam() {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [simulation, setSimulation] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [strickenOptions, setStrickenOptions] = useState({});

  const toggleStrike = (questionId, optionIndex, e) => {
    e.stopPropagation();
    setStrickenOptions((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [optionIndex]: !(prev[questionId]?.[optionIndex] || false),
      },
    }));
  };

  useEffect(() => {
    const sim = mockSimulations[simulationId];
    if (!sim) {
      navigate("/simulations");
      return;
    }
    setSimulation(sim);
    setTimeLeft(sim.duration * 60);
  }, [simulationId, navigate]);

  useEffect(() => {
    if (!timeLeft || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishSimulation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const handleAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < simulation.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const finishSimulation = async () => {
    if (!currentUser || !simulation) return;

    const timeSpent = Math.round((simulation.duration * 60 - timeLeft) / 60);
    const stats = calculateDetailedStats(
      answers,
      simulation.questions,
      timeSpent
    );

    try {
      const { error } = await supabase.from("historico_simulados").insert([
        {
          usuario_id: currentUser.id,
          simulado_id: simulation.id,
          titulo_simulado: simulation.title,
          respostas: answers,
          pontuacao: stats.traditionalScore,
          pontuacao_tri: stats.triScore,
          finalizado_em: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar resultado:", error);
    } finally {
      setIsFinished(true);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!simulation) return null;

  if (isFinished) {
    const stats = calculateDetailedStats(
      answers,
      simulation.questions,
      Math.round((simulation.duration * 60 - timeLeft) / 60)
    );

    return (
      <div className="min-h-screen bg-background">
        <TopNav title="Simulado Concluído" />

        <div className="pt-24 px-6 pb-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Card de Resultados */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">Simulado Concluído!</CardTitle>
                <CardDescription>
                  Confira seu desempenho no simulado {simulation.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                    <div className="text-4xl font-bold text-[#F3C92C]">
                      {stats.triScore}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Nota TRI
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                    <div className="text-4xl font-bold text-blue-500">
                      {stats.traditionalScore}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Nota Tradicional
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold text-green-500">
                        {stats.correctAnswers}
                      </span>
                      <span className="text-xl font-medium text-muted-foreground">
                        /
                      </span>
                      <span className="text-4xl font-bold text-red-500">
                        {stats.totalQuestions - stats.correctAnswers}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Acertos / Erros
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                    <div className="text-4xl font-bold">{stats.timeSpent}</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Minutos Gastos
                    </div>
                  </div>
                </div>

                {/* Estatísticas por Nível de Dificuldade */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Desempenho por Nível de Dificuldade
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {["EASY", "MEDIUM", "HARD"].map((level) => {
                      const data = stats.difficultyStats[level] || {
                        total: 0,
                        correct: 0,
                      };
                      return (
                        <div key={level} className="p-4 border rounded-lg">
                          <div className="font-medium mb-2">
                            {level === "EASY"
                              ? "Fácil"
                              : level === "MEDIUM"
                              ? "Médio"
                              : "Difícil"}
                          </div>
                          <div className="text-2xl font-bold">
                            {data.total > 0
                              ? Math.round((data.correct / data.total) * 100)
                              : 0}
                            %
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.correct}/{data.total} questões
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Índices de Desempenho */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Índices de Desempenho
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">
                        Índice de Coerência
                      </div>
                      <div className="text-2xl font-bold">
                        {Math.round(stats.coherenceIndex * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Consistência nas respostas
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">
                        Eficiência de Tempo
                      </div>
                      <div className="text-2xl font-bold">
                        {Math.round(stats.timeEfficiency * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Gestão do tempo
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revisão das Questões */}
            <Card>
              <CardHeader>
                <CardTitle>Revisão das Questões</CardTitle>
                <CardDescription>
                  Revise todas as questões e veja as respostas corretas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {simulation.questions.map((question, questionIndex) => {
                    const isCorrect =
                      answers[questionIndex] === question.correctAnswer;
                    const userAnswer = answers[questionIndex];

                    return (
                      <div key={questionIndex} className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              isCorrect ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {isCorrect ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <X className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">
                              Questão {questionIndex + 1}
                            </h4>
                            <p className="text-muted-foreground">
                              {question.question}
                            </p>
                          </div>
                        </div>

                        <div className="ml-9 space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border ${
                                optionIndex === question.correctAnswer
                                  ? "border-green-500 bg-green-500/10"
                                  : optionIndex === userAnswer && !isCorrect
                                  ? "border-red-500 bg-red-500/10"
                                  : "border-input"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {String.fromCharCode(97 + optionIndex)})
                                </span>
                                <span
                                  className={`flex-1 ${
                                    optionIndex === question.correctAnswer
                                      ? "text-green-700 dark:text-green-300"
                                      : optionIndex === userAnswer && !isCorrect
                                      ? "text-red-700 dark:text-red-300"
                                      : ""
                                  }`}
                                >
                                  {option}
                                </span>
                                {optionIndex === question.correctAnswer && (
                                  <Check className="w-4 h-4 text-green-500" />
                                )}
                                {optionIndex === userAnswer && !isCorrect && (
                                  <X className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 mt-4"
                            onClick={() => {
                              const dialog = document.createElement("div");
                              dialog.className = "fixed inset-0 z-50";
                              document.body.appendChild(dialog);

                              const cleanup = () => {
                                document.body.removeChild(dialog);
                              };

                              const root = ReactDOM.createRoot(dialog);
                              root.render(
                                <AIChatWrapper
                                  question={{
                                    ...question,
                                    id: `simulation_${simulation.id}_question_${questionIndex}`,
                                  }}
                                  selectedAnswer={userAnswer}
                                  onClose={cleanup}
                                />
                              );
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Consultar com IA
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/simulations")}
              >
                Voltar para Simulados
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refazer Simulado
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = simulation.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-background">
      <TopNav title={simulation.title} />

      {/* Barra de Progresso Fixa */}
      <div className="fixed top-16 left-0 right-0 bg-card border-b z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} de {simulation.questions.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col space-y-1">
              <Progress
                value={
                  (Object.keys(answers).length / simulation.questions.length) *
                  100
                }
                className="w-40 h-2 bg-secondary"
                indicatorClassName="bg-[#F3C92C]"
              />
              <span className="text-xs text-muted-foreground text-center">
                {Object.keys(answers).length} de {simulation.questions.length}{" "}
                respondidas
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="pt-36 pb-32 px-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Questão {currentQuestion + 1}
              </CardTitle>
              <CardDescription className="text-base">
                {currentQuestionData.question}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentQuestionData.options.map((option, index) => (
                  <div
                    key={index}
                    className={`group relative flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer ${
                      answers[currentQuestion] === index ? "border-primary" : ""
                    }`}
                    onClick={() => handleAnswer(index)}
                  >
                    <div
                      className={`flex items-center justify-center w-4 h-4 rounded-full border ${
                        answers[currentQuestion] === index
                          ? "bg-[#F3C92C] border-[#F3C92C]"
                          : "border-input"
                      }`}
                    >
                      {answers[currentQuestion] === index && (
                        <Check className="h-3 w-3 text-black absolute" />
                      )}
                    </div>
                    <Label
                      className={`flex-1 cursor-pointer ${
                        strickenOptions[currentQuestionData.id]?.[index]
                          ? "line-through"
                          : ""
                      }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(97 + index)})
                      </span>
                      {option}
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) =>
                        toggleStrike(currentQuestionData.id, index, e)
                      }
                    >
                      <Scissors className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {currentQuestion === simulation.questions.length - 1 ? (
            <Button onClick={finishSimulation}>
              Finalizar
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              Próxima
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulationExam;
