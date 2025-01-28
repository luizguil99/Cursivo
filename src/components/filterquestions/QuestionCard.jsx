import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, BookOpen } from "lucide-react";

// Componente que exibe um card de questão individual
export function QuestionCard({ question }) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              {question.titulo || `Questão ${question.id}`}
            </h3>
            <div className="flex gap-2 mt-2">
              {question.banca && (
                <Badge variant="outline">
                  {question.banca.toUpperCase()}
                </Badge>
              )}
              {question.ano && (
                <Badge variant="outline">{question.ano}</Badge>
              )}
              {question.dificuldade && (
                <Badge 
                  variant="outline" 
                  className={
                    question.dificuldade === "facil" 
                      ? "bg-green-50 text-green-600 border-green-200"
                      : question.dificuldade === "medio"
                      ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }
                >
                  {question.dificuldade.charAt(0).toUpperCase() + question.dificuldade.slice(1)}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground line-clamp-2">
            {question.enunciado}
          </p>
          <div className="flex gap-2 flex-wrap">
            {question.topicos && question.topicos.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            title="Visualizar questão"
            onClick={() => {/* Implementar visualização */}}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            title="Praticar questão"
            onClick={() => {/* Implementar prática */}}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
