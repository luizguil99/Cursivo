import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, BookOpen } from "lucide-react";

// Componente que exibe a lista de questões filtradas
export default function QuestionList({ filters, searchQuery }) {
  // Aqui você implementaria a lógica para buscar e filtrar as questões
  // Este é apenas um exemplo de layout
  const questions = [
    {
      id: 1,
      title: "Questão de Matemática - ENEM 2023",
      subject: "matematica",
      difficulty: "medio",
      year: "2023",
      examBoard: "enem",
      topics: ["Álgebra"],
      content: "Em uma progressão aritmética...",
    },
    // Adicione mais questões de exemplo
  ];

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{question.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    {question.examBoard.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{question.year}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      question.difficulty === "facil"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : question.difficulty === "medio"
                        ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }
                  >
                    {question.difficulty.charAt(0).toUpperCase() +
                      question.difficulty.slice(1)}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground line-clamp-2">
                {question.content}
              </p>
              <div className="flex gap-2 flex-wrap">
                {question.topics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {questions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma questão encontrada com os filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
}
