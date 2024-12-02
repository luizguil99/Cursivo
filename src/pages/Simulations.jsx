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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
  const latestAttempt =
    simulation.history?.length > 0 ? simulation.history[0] : null;

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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Simulados</DialogTitle>
          <DialogDescription>
            Veja todos os seus simulados realizados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Simulado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Nota TRI</TableHead>
                  <TableHead>Nota Tradicional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>{attempt.titulo_simulado}</TableCell>
                    <TableCell>
                      {new Date(attempt.finalizado_em).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-[#F3C92C]">
                        {attempt.pontuacao_tri?.toFixed(1) || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-500">
                        {attempt.pontuacao}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Simulations() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [simulations] = useState(mockSimulations);
  const [history, setHistory] = useState([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from("historico_simulados")
          .select("*")
          .eq("usuario_id", currentUser.id)
          .order("finalizado_em", { ascending: false });

        if (error) throw error;

        setHistory(data || []);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const handleStartSimulation = (simulationId) => {
    navigate(`/simulations/${simulationId}`);
  };

  const getSimulationHistory = (simulationId) => {
    return history.filter((h) => h.simuladoId === simulationId);
  };

  const calculateOverallProgress = () => {
    if (history.length === 0) return 0;

    // Calcula a média das notas TRI
    const totalScore = history.reduce((acc, curr) => {
      // Usa pontuacao_tri se disponível, senão usa pontuacao tradicional
      const score = curr.pontuacao_tri || curr.pontuacao || 0;
      return acc + score;
    }, 0);

    const average = Math.round(totalScore / history.length);

    // Se tiver notas TRI, retorna direto (já está na escala 0-1000)
    if (history.some((h) => h.pontuacao_tri)) {
      return average;
    }

    // Se não tiver TRI, converte a média tradicional (0-100) para escala TRI (0-1000)
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
                  <span className="text-2xl font-bold">{history.length}</span>
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
                  onClick={() => setIsHistoryDialogOpen(true)}
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
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        history={history}
      />
    </div>
  );
}

export default Simulations;
