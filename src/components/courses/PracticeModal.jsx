import React, { useState, useEffect } from "react";
import {
  X,
  Video,
  ArrowLeft,
  ArrowRight,
  Scissors,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import AIChat from "./AIChat";
import confetti from "canvas-confetti";

function PracticeModal({ course, topic, onClose }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(topic || "all");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [strickenOptions, setStrickenOptions] = useState({});

  const toggleStrike = (questionId, optionIndex) => {
    setStrickenOptions((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [optionIndex]: !(prev[questionId]?.[optionIndex] || false),
      },
    }));
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!course?.id) return;

      try {
        const courseName = course.name || course.title;
        if (!courseName) {
          console.error("Course name/title not found:", course);
          return;
        }

        const { data: questionsData, error } = await supabase
          .from("questoes")
          .select("*")
          .eq("assunto", courseName);

        if (error) throw error;

        // Mapeando os campos do Supabase para o formato esperado pelo componente
        const mappedQuestions = questionsData.map((q) => ({
          id: q.id,
          topic: q.topico,
          question: q.questao,
          image: q.url_imagem,
          options: q.opcoes,
          correctAnswer: q.resposta_correta,
          solutionVideo: q.video_solucao,
          examBoard: q.banca_examinadora,
        }));

        setQuestions(mappedQuestions);
      } catch (error) {
        console.error("Erro ao buscar questões:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [course?.id, course?.name, course?.title]);

  const topics = ["all", ...new Set(questions.map((q) => q.topic))];

  const filteredQuestions = React.useMemo(() => {
    if (selectedTopic === "all") return questions;
    return questions.filter((q) => q.topic === selectedTopic);
  }, [questions, selectedTopic]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div
          className="bg-card w-full max-w-xl mx-4 rounded-lg shadow-lg relative"
          style={{ boxShadow: "0 0 20px rgba(243, 201, 44, 0.3)" }}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {topic ? `Praticar: ${topic}` : `Praticar: ${course.name}`}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center py-8 text-muted-foreground">
              Carregando questões...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If there are no questions, show a message
  if (filteredQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div
          className="bg-card w-full max-w-xl mx-4 rounded-lg shadow-lg relative"
          style={{ boxShadow: "0 0 20px rgba(243, 201, 44, 0.3)" }}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {topic ? `Praticar: ${topic}` : `Praticar: ${course.name}`}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center py-8 text-muted-foreground">
              Não há questões disponíveis para este tópico no momento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
    if (index === filteredQuestions[currentQuestion].correctAnswer) {
      setScore((prev) => prev + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF6347"], // Cores dourado, laranja e vermelho-tomate
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowSolution(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowSolution(false);
    }
  };

  const currentQuestionData = filteredQuestions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-card w-full max-w-xl mx-4 rounded-lg shadow-lg relative"
        style={{ boxShadow: "0 0 20px rgba(243, 201, 44, 0.3)" }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              {topic
                ? `Praticar: ${topic}`
                : course?.name || course?.title
                ? `Praticar: ${course.name || course.title}`
                : "Praticar"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Topic Select */}
          <div className="mb-4">
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tópico" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic === "all" ? "Todos os tópicos" : topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Questão {currentQuestion + 1} de {filteredQuestions.length}
              </span>
              <span>Pontuação: {score}</span>
            </div>

            {currentQuestionData.examBoard && (
              <div className="text-sm text-muted-foreground mb-2">
                Banca: {currentQuestionData.examBoard}
              </div>
            )}

            <p className="font-medium">{currentQuestionData.question}</p>

            {currentQuestionData.image && (
              <img
                src={currentQuestionData.image}
                alt="Question"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            {/* Options */}
            <div className="space-y-2">
              {currentQuestionData.options
                .filter((option) => option !== "")
                .map((option, index) => {
                  let buttonStyle =
                    "w-full justify-start hover:opacity-100 relative pl-10";
                  if (selectedAnswer !== null) {
                    if (index === currentQuestionData.correctAnswer) {
                      buttonStyle +=
                        " bg-green-500 hover:bg-green-500 text-white";
                    } else if (
                      index === selectedAnswer &&
                      index !== currentQuestionData.correctAnswer
                    ) {
                      buttonStyle += " bg-red-500 hover:bg-red-500 text-white";
                    }
                  }

                  const isStricken =
                    strickenOptions[currentQuestionData.id]?.[index] || false;

                  return (
                    <div key={index} className="relative group">
                      {selectedAnswer === null && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleStrike(currentQuestionData.id, index)
                          }
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                        >
                          <Scissors className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        key={index}
                        variant="outline"
                        className={buttonStyle}
                        onClick={() => !isStricken && handleAnswer(index)}
                        disabled={selectedAnswer !== null || isStricken}
                      >
                        <span
                          className={
                            isStricken ? "line-through opacity-50" : ""
                          }
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F3C92C] text-black font-medium mr-2">
                            {String.fromCharCode(97 + index)}
                          </span>
                          {option}
                        </span>
                      </Button>
                    </div>
                  );
                })}
            </div>

            {/* Solution and AI Chat Buttons */}
            {selectedAnswer !== null && (
              <div className="flex gap-2 mt-4">
                {currentQuestionData.solutionVideo && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowVideoModal(true)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Ver Solução em Vídeo
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAIChat(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Consultar com IA
                </Button>
              </div>
            )}

            {/* Video Modal */}
            {showVideoModal && currentQuestionData.solutionVideo && (
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
                    src={currentQuestionData.solutionVideo.replace(
                      "watch?v=",
                      "embed/"
                    )}
                    title="Solution Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* AI Chat Modal */}
            {showAIChat && (
              <AIChat
                question={currentQuestionData}
                selectedAnswer={selectedAnswer}
                explanation={currentQuestionData.explanation}
                onClose={() => setShowAIChat(false)}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentQuestion === filteredQuestions.length - 1}
              >
                Próxima
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticeModal;
