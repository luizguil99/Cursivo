import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mapa de tópicos por matéria (exemplo)
const TOPICS_BY_SUBJECT = {
  matematica: [
    "Álgebra",
    "Geometria",
    "Trigonometria",
    "Estatística",
    "Probabilidade",
    "Matemática Financeira",
  ],
  portugues: [
    "Interpretação de Texto",
    "Gramática",
    "Literatura",
    "Redação",
    "Linguística",
  ],
  // Adicione mais tópicos para outras matérias
};

// Componente de filtro por tópico
export default function TopicFilter({ value = [], onChange, subject }) {
  const [availableTopics, setAvailableTopics] = useState([]);

  // Atualiza tópicos disponíveis quando a matéria muda
  useEffect(() => {
    if (subject) {
      setAvailableTopics(TOPICS_BY_SUBJECT[subject] || []);
    } else {
      setAvailableTopics([]);
    }
  }, [subject]);

  const handleTopicChange = (topicId) => {
    const newValue = value.includes(topicId)
      ? value.filter((id) => id !== topicId)
      : [...value, topicId];
    onChange(newValue);
  };

  if (!subject) {
    return (
      <div className="space-y-3">
        <Label className="text-base">Tópicos</Label>
        <p className="text-sm text-muted-foreground">
          Selecione uma matéria para ver os tópicos disponíveis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-base">Tópicos</Label>
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-3">
          {availableTopics.map((topic) => (
            <div key={topic} className="flex items-center space-x-2">
              <Checkbox
                id={topic}
                checked={value.includes(topic)}
                onCheckedChange={() => handleTopicChange(topic)}
              />
              <Label htmlFor={topic} className="font-normal">
                {topic}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
