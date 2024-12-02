import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle } from "lucide-react";

function ExamHistory({ userId }) {
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchExamHistory();
    }
  }, [userId]);

  const fetchExamHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_results")
        .select(`
          *,
          simulation:simulation_id (
            title,
            description,
            duration,
            questions
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExamHistory(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (exam) => {
    if (!exam.answers || !exam.correct_answers) return { correctAnswers: 0, totalQuestions: 0, accuracy: "0.0" };
    
    const correctAnswers = exam.answers.filter(
      (answer, index) => answer === exam.correct_answers[index]
    ).length;
    const totalQuestions = exam.answers.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return {
      correctAnswers,
      totalQuestions,
      accuracy: accuracy.toFixed(1)
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <span>Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Simulados</CardTitle>
        <CardDescription>
          Visualize seu desempenho em simulados anteriores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          {examHistory.length === 0 ? (
            <div className="text-center py-8">
              <p>Nenhum simulado realizado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examHistory.map((exam) => {
                const stats = calculateStats(exam);
                return (
                  <Card key={exam.id} className="p-4">
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {exam.simulation?.title || "Simulado"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(exam.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Badge variant={exam.completed ? "success" : "secondary"}>
                          {exam.completed ? "Concluído" : "Em andamento"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Pontuação:</span>
                          <span className="text-lg font-bold">
                            {exam.score?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Taxa de Acerto:</span>
                          <span className="text-lg font-bold">{stats.accuracy}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Tempo:</span>
                          <span className="text-lg font-bold">
                            {Math.floor(exam.time_taken / 60)} min
                          </span>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Detalhes das Questões</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {exam.answers?.map((answer, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-lg border"
                            >
                              <span className="text-sm">Questão {index + 1}</span>
                              {answer === exam.correct_answers[index] ? (
                                <CheckCircle className="text-green-500 h-4 w-4" />
                              ) : (
                                <XCircle className="text-red-500 h-4 w-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ExamHistory;
