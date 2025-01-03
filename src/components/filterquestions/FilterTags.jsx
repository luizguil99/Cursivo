import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Mapeia os IDs dos filtros para labels amigáveis
const FILTER_LABELS = {
  subject: {
    matematica: "Matemática",
    portugues: "Português",
    historia: "História",
    geografia: "Geografia",
    fisica: "Física",
    quimica: "Química",
    biologia: "Biologia",
    ingles: "Inglês",
  },
  difficulty: {
    facil: "Fácil",
    medio: "Médio",
    dificil: "Difícil",
  },
};

// Componente que exibe as tags dos filtros ativos
export default function FilterTags({ filters, onRemoveFilter }) {
  const getFilterTags = () => {
    const tags = [];

    // Matéria
    if (filters.subject) {
      tags.push({
        type: "subject",
        value: filters.subject,
        label: FILTER_LABELS.subject[filters.subject],
      });
    }

    // Dificuldade
    if (filters.difficulty) {
      tags.push({
        type: "difficulty",
        value: filters.difficulty,
        label: FILTER_LABELS.difficulty[filters.difficulty],
      });
    }

    // Ano
    if (filters.year) {
      tags.push({
        type: "year",
        value: filters.year,
        label: `Ano ${filters.year}`,
      });
    }

    // Tópicos
    filters.topics?.forEach((topic) => {
      tags.push({
        type: "topics",
        value: topic,
        label: topic,
      });
    });

    // Banca
    filters.examBoard?.forEach((board) => {
      tags.push({
        type: "examBoard",
        value: board,
        label: board.toUpperCase(),
      });
    });

    return tags;
  };

  const tags = getFilterTags();

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tags.map((tag, index) => (
        <Badge
          key={`${tag.type}-${tag.value}-${index}`}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          {tag.label}
          <button
            onClick={() => {
              if (Array.isArray(filters[tag.type])) {
                onRemoveFilter(
                  tag.type,
                  filters[tag.type].filter((value) => value !== tag.value)
                );
              } else {
                onRemoveFilter(tag.type, "");
              }
            }}
            className="ml-1 hover:bg-accent rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
