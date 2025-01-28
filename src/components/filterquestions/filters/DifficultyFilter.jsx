import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Níveis de dificuldade disponíveis
const DIFFICULTY_LEVELS = [
  { id: "facil", label: "Fácil" },
  { id: "medio", label: "Médio" },
  { id: "dificil", label: "Difícil" },
];

// Componente de filtro por dificuldade
export default function DifficultyFilter({ value, onChange }) {
  return (
    <div className="space-y-3">
      <Label className="text-base">Nível de Dificuldade</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        {DIFFICULTY_LEVELS.map((level) => (
          <div key={level.id} className="flex items-center space-x-2">
            <RadioGroupItem value={level.id} id={level.id} />
            <Label htmlFor={level.id} className="font-normal">
              {level.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
