import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Trophy, ArrowRight, Check, X } from "lucide-react";
import TopNav from "@/components/layouts/TopNav";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

const mockSimulations = [
  {
    id: "1",
    title: "Simulado ENEM Completo",
    description:
      "Simulado completo com questões de todas as áreas do conhecimento do ENEM",
    duration: 180,
    totalQuestions: 90,
    subjects: ["Matemática", "Português", "Ciências", "História", "Geografia"],
    questions: [
      {
        question: "Qual é a capital do Brasil?",
        options: ["Brasília", "Rio de Janeiro", "São Paulo", "Belo Horizonte"],
        correctAnswer: 0,
      },
      {
        question: "Qual é o maior planeta do sistema solar?",
        options: ["Terra", "Marte", "Júpiter", "Saturno"],
        correctAnswer: 2,
      },
      // ...
    ],
  },
  {
    id: "2",
    title: "Simulado de Matemática",
    description: "Simulado focado em questões de matemática do ENEM",
    duration: 90,
    totalQuestions: 45,
    subjects: ["Matemática"],
    questions: [
      {
        question: "Qual é o valor de x na equação 2x + 5 = 11?",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1,
      },
      {
        question: "Qual é o resultado da soma de 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
      },
      // ...
    ],
  },
  {
    id: "3",
    title: "Simulado de Linguagens",
    description: "Simulado com questões de português, literatura e inglês",
    duration: 90,
    totalQuestions: 45,
    subjects: ["Português", "Literatura", "Inglês"],
    questions: [
      {
        question: "Qual é o autor do livro 'Dom Casmurro'?",
        options: [
          "Machado de Assis",
          "Graciliano Ramos",
          "Guimarães Rosa",
          "Carlos Drummond de Andrade",
        ],
        correctAnswer: 0,
      },
      {
        question: "Qual é o significado da palavra 'saudade'?",
        options: ["Tristeza", "Alegria", "Satisfação", "Nostalgia"],
        correctAnswer: 3,
      },
      // ...
    ],
  },
];

function SimulationCard({ simulation, onStart }) {
  const latestAttempt = simulation.history?.length > 0 ? simulation.history[0] : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-[#F3C92C]/30">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{simulation.title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {simulation.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {simulation.subjects.map((subject, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-full text-xs font-medium bg-[#F3C92C]/10 text-[#F3C92C] border border-[#F3C92C]/20"
              >
                {subject}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{simulation.duration} minutos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span>{simulation.totalQuestions} questões</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="bg-[#F3C92C] text-black hover:bg-[#F3C92C]/90 hover:text-black border-0"
            onClick={() => onStart(simulation.id)}
          >
            Começar Simulado
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SimulationHistoryDialog({ isOpen, onClose, history }) {
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const { currentUser } = useAuth();

  const handleClearHistory = async () => {
    if (clearConfirmText.toLowerCase() !== "confirmar") {
      return;
    }

    try {
      const historyRef = collection(db, "simulationHistory");
      const q = query(historyRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
    }
  };

  const calculatePercentage = (attempt) => {
    if (!attempt || !attempt.correctAnswers || !attempt.totalQuestions)
      return 0;
    return Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100);
  };

  if (selectedAttempt) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-bold">Detalhes do Simulado</DialogTitle>
                <DialogDescription className="text-[#F3C92C]">
                  {new Date(selectedAttempt.completedAt).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedAttempt(null)}
                size="sm"
                className="hover:bg-[#F3C92C]/10 hover:text-[#F3C92C] hover:border-[#F3C92C]/20"
              >
                Voltar
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card hover:border-[#F3C92C]/30 transition-colors">
                <div className="text-4xl font-bold text-[#F3C92C]">
                  {selectedAttempt.triScore}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Nota TRI
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                <div className="text-4xl font-bold text-blue-500">
                  {calculatePercentage(selectedAttempt)}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Porcentagem de Acerto
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold text-green-500">
                    {selectedAttempt.correctAnswers}
                  </span>
                  <span className="text-xl font-medium text-muted-foreground">
                    /
                  </span>
                  <span className="text-4xl font-bold text-red-500">
                    {selectedAttempt.totalQuestions -
                      selectedAttempt.correctAnswers}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Acertos / Erros
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-card">
                <div className="text-4xl font-bold">
                  {selectedAttempt.timeSpent}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Minutos Gastos
                </div>
              </div>
            </div>

            {selectedAttempt.difficultyStats && (
              <div className="border rounded-lg p-6">
                <h3 className="font-medium text-lg mb-4">
                  Desempenho por Nível de Dificuldade
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { key: "EASY", label: "Fácil" },
                    { key: "MEDIUM", label: "Médio" },
                    { key: "HARD", label: "Difícil" }
                  ].map(({ key, label }) => {
                    const data = selectedAttempt.difficultyStats?.[key] || { correct: 0, total: 0 };
                    const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                    
                    return (
                      <div key={key} className="p-4 border rounded-lg hover:border-[#F3C92C]/30 transition-colors">
                        <div className="font-medium mb-2 text-[#F3C92C]">{label}</div>
                        <div className="text-2xl font-bold">
                          {percentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.correct}/{data.total} questões
                        </div>
                        <Progress
                          value={percentage}
                          className="mt-2 bg-muted"
                          indicatorClassName="bg-[#F3C92C]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Revisão das Questões */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Revisão das Questões
              </h3>
              <div className="space-y-6">
                {mockSimulations[selectedAttempt.simulationId]?.questions.map(
                  (question, index) => {
                    const isCorrect =
                      selectedAttempt.answers[index] === question.correctAnswer;
                    const userAnswer = selectedAttempt.answers[index];

                    return (
                      <div key={index} className="p-4 border rounded-lg">
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
                          <div className="flex-1">
                            <h4 className="font-medium mt-4 p-4 border rounded-lg hover:border-[#F3C92C]/30 transition-colors">
                              Questão {index + 1}
                            </h4>
                            <p className="text-muted-foreground mb-4">
                              {question.question}
                            </p>
                            <div className="space-y-2">
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
                                          : optionIndex === userAnswer &&
                                            !isCorrect
                                          ? "text-red-700 dark:text-red-300"
                                          : ""
                                      }`}
                                    >
                                      {option}
                                    </span>
                                    {optionIndex === question.correctAnswer && (
                                      <Check className="w-4 h-4 text-green-500" />
                                    )}
                                    {optionIndex === userAnswer &&
                                      !isCorrect && (
                                        <X className="w-4 h-4 text-red-500" />
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Histórico de Simulados</DialogTitle>
              <DialogDescription>
                Veja seu progresso nos simulados realizados
              </DialogDescription>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowClearConfirm(true)}
            >
              Limpar Histórico
            </Button>
          </div>
        </DialogHeader>

        {showClearConfirm ? (
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Digite "confirmar" para limpar todo o histórico de simulados:
            </div>
            <Input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="confirmar"
            />
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmText("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearHistory}
                disabled={clearConfirmText.toLowerCase() !== "confirmar"}
              >
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {history.map((attempt, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-4 cursor-pointer hover:border-[#F3C92C]/30 transition-colors"
                onClick={() => setSelectedAttempt(attempt)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium hover:text-[#F3C92C] transition-colors">{attempt.simulationTitle}</h3>
                  <span className="text-sm text-[#F3C92C]">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Nota TRI
                    </span>
                    <div className="text-2xl font-bold">
                      {attempt.triScore || "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Porcentagem de Acerto
                    </span>
                    <div className="text-2xl font-bold">
                      {calculatePercentage(attempt)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">
                      Acertos
                    </span>
                    <div className="text-2xl font-bold">
                      {attempt.correctAnswers}/{attempt.totalQuestions}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Tempo</span>
                    <div className="text-2xl font-bold">
                      {attempt.timeSpent}min
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Simulations() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [simulations] = useState(mockSimulations);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimulationHistory() {
      if (!currentUser) return;

      setLoading(true);
      console.log("Carregando histórico para usuário:", currentUser.uid); // Debug log

      try {
        const historyRef = collection(db, "simulationHistory");
        const q = query(historyRef, where("userId", "==", currentUser.uid));

        const querySnapshot = await getDocs(q);
        console.log("Documentos encontrados:", querySnapshot.size); // Debug log

        const history = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Documento:", data); // Debug log
          return {
            id: doc.id,
            ...data,
          };
        });

        console.log("Histórico carregado:", history); // Debug log
        setSimulationHistory(history);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSimulationHistory();
  }, [currentUser]);

  const handleStartSimulation = (simulationId) => {
    navigate(`/simulations/${simulationId}`);
  };

  const getSimulationHistory = (simulationId) => {
    return simulationHistory.filter((h) => h.simulationId === simulationId);
  };

  const calculateOverallProgress = () => {
    if (simulationHistory.length === 0) return 0;

    // Calcula a média das notas TRI
    const totalScore = simulationHistory.reduce((acc, curr) => {
      // Usa triScore se disponível, senão usa score tradicional
      const score = curr.triScore || curr.score;
      return acc + score;
    }, 0);

    const average = Math.round(totalScore / simulationHistory.length);

    // Se tiver notas TRI, retorna direto (já está na escala 0-1000)
    if (simulationHistory.some((h) => h.triScore)) {
      return average;
    }

    // Se forem todas notas tradicionais, converte para escala TRI (0-1000)
    return Math.round((average / 100) * 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="Simulados" />
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="pt-24 px-6 pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progresso Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Média TRI</span>
                    <span>{calculateOverallProgress()}</span>
                  </div>
                  <Progress
                    value={(calculateOverallProgress() / 1000) * 100}
                    className="bg-muted"
                    indicatorClassName="bg-[#F3C92C]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Simulados Realizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {simulationHistory.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  Ver Histórico Completo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Simulados */}
          <div className="grid gap-4 md:grid-cols-2">
            {simulations.map((simulation) => (
              <SimulationCard
                key={simulation.id}
                simulation={simulation}
                onStart={handleStartSimulation}
                history={getSimulationHistory(simulation.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <SimulationHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={simulationHistory}
      />
    </div>
  );
}

export default Simulations;
