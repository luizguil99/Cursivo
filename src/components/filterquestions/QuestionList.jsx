import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Timer,
  CheckCircle2,
  XCircle,
  ListTodo,
  Video,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  X,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";
import AIChat from "@/components/courses/AIChat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function QuestionList({ questions = [], loading }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem("questionList_score");
    return saved ? parseInt(saved) : 0;
  });
  const [wrongAnswers, setWrongAnswers] = useState(() => {
    const saved = localStorage.getItem("questionList_wrongAnswers");
    return saved ? parseInt(saved) : 0;
  });
  const [showAIChat, setShowAIChat] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("questionList_score", score);
  }, [score]);

  useEffect(() => {
    localStorage.setItem("questionList_wrongAnswers", wrongAnswers);
  }, [wrongAnswers]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    // Reinicia o timer quando muda de questão
    setTimer(0);
    setTimerActive(true);
  }, [currentQuestion]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleReset = () => {
    if (
      window.confirm("Tem certeza que deseja limpar todas as estatísticas?")
    ) {
      setScore(0);
      setWrongAnswers(0);
      localStorage.removeItem("questionList_score");
      localStorage.removeItem("questionList_wrongAnswers");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3C92C]"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">Nenhuma questão encontrada.</p>
      </div>
    );
  }

  const question = questions[currentQuestion];
  console.log("Badge Data:", {
    assunto: question.assunto,
    topico: question.topico,
    banca: question.banca_examinadora,
  });

  const options =
    typeof question.opcoes === "string"
      ? JSON.parse(question.opcoes)
      : question.opcoes || [];

  // Verifica se há alternativas válidas
  const hasValidOptions = Array.isArray(options) && options.length > 0;

  const handleAnswer = async (index) => {
    if (selectedAnswer !== null) return;

    // Para o cronômetro quando responder
    setTimerActive(false);

    setSelectedAnswer(index);
    const isCorrect = index === question.resposta_correta;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF6347"],
      });
    } else {
      setWrongAnswers((prev) => prev + 1);
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("questoes_concluidas").insert({
          usuario_id: user.id,
          questao_id: question.id,
          resposta_usuario: index,
          esta_correta: isCorrect,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowAIChat(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowAIChat(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-6">
        {/* Coluna Principal com Questões */}
        <div className="flex-1 relative">
          {/* Lista de Questões */}
          <div className="space-y-6">
            <Card className="p-4 bg-white shadow-sm">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.assunto && (
                  <Badge
                    variant="outline"
                    className="bg-[#F3C92C]/10 text-[#F3C92C] border-[#F3C92C]/20"
                  >
                    {question.assunto}
                  </Badge>
                )}
                {question.topico && (
                  <Badge variant="outline" className="text-xs">
                    {question.topico}
                  </Badge>
                )}
                {question.banca_examinadora && (
                  <Badge variant="outline" className="text-xs">
                    {question.banca_examinadora}
                  </Badge>
                )}
              </div>

              {/* Enunciado */}
              <div className="mb-4">
                <div className="text-sm text-gray-900">{question.questao}</div>
                {question.url_imagem && (
                  <img
                    src={question.url_imagem}
                    alt="Imagem da questão"
                    className="mt-3 max-w-full h-auto rounded-md"
                  />
                )}
              </div>

              {/* Alternativas */}
              {hasValidOptions ? (
                <div className="space-y-2">
                  {options.map((option, index) => {
                    if (index === 4 && !option) return null;

                    const isSelected = selectedAnswer === index;
                    const isCorrect =
                      selectedAnswer !== null &&
                      index === question.resposta_correta;
                    const isWrong = isSelected && !isCorrect;

                    return (
                      <div
                        key={index}
                        onClick={() => handleAnswer(index)}
                        className={`
                          flex items-start p-2.5 rounded-lg border text-sm cursor-pointer transition-all
                          ${
                            isSelected
                              ? isCorrect
                                ? "border-green-500 bg-green-50"
                                : "border-red-500 bg-red-50"
                              : "border-gray-100 hover:border-[#F3C92C]/30"
                          }
                          ${
                            selectedAnswer !== null &&
                            index === question.resposta_correta
                              ? "border-green-500 bg-green-50"
                              : ""
                          }
                        `}
                      >
                        <span className="font-medium text-gray-700 mr-3 mt-0.5">
                          {String.fromCharCode(65 + index)})
                        </span>
                        <span className="flex-1">{option}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Esta questão não possui alternativas cadastradas.
                </div>
              )}

              {/* Ações da Questão */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentQuestion === questions.length - 1}
                    >
                      Próxima
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {selectedAnswer !== null && (
                    <div className="flex gap-2">
                      {question.video_solucao && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVideoModal(true)}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIChat(!showAIChat)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Chat com IA */}
            {showAIChat && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                <div className="bg-white w-full max-w-2xl mx-4 rounded-lg h-[80vh]">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Consultar com IA</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAIChat(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-[calc(80vh-64px)]">
                    <AIChat
                      question={{
                        id: question.id,
                        question: question.questao,
                        options: [
                          question.alternativa_a,
                          question.alternativa_b,
                          question.alternativa_c,
                          question.alternativa_d,
                          question.alternativa_e,
                        ],
                        correctAnswer: question.resposta_correta,
                      }}
                      selectedAnswer={selectedAnswer}
                      onClose={() => setShowAIChat(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal do Vídeo */}
        {showVideoModal && question.video_solucao && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
            onClick={() => setShowVideoModal(false)}
          >
            <div
              className="w-full max-w-3xl mx-4 aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                className="w-full h-full rounded-lg"
                src={question.video_solucao.replace("watch?v=", "embed/")}
                title="Resolução em Vídeo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Barra Lateral com Estatísticas */}
        <div className="w-64">
          <Card className="p-4 bg-white shadow-sm sticky top-4">
            <div className="space-y-4">
              {/* Progresso */}
              <div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-[#F3C92C]"
                    style={{
                      width: `${
                        ((score + wrongAnswers) / questions.length) * 100
                      }%`,
                    }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Questão {currentQuestion + 1} de {questions.length}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{wrongAnswers}</span>
                </div>
              </div>

              {/* Cronômetro */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {formatTime(timer)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
