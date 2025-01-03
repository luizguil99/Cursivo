import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Lista de matérias disponíveis
const SUBJECTS = [
  { id: "matematica", label: "Matemática" },
  { id: "portugues", label: "Português" },
  { id: "historia", label: "História" },
  { id: "geografia", label: "Geografia" },
  { id: "fisica", label: "Física" },
  { id: "quimica", label: "Química" },
  { id: "biologia", label: "Biologia" },
  { id: "ingles", label: "Inglês" },
];

// Componente de filtro por matéria
export default function SubjectFilter({ value, onChange }) {
  return (
    <div className="space-y-3">
      <Label className="text-base">Matéria</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-2 gap-4"
      >
        {SUBJECTS.map((subject) => (
          <div key={subject.id} className="flex items-center space-x-2">
            <RadioGroupItem value={subject.id} id={subject.id} />
            <Label htmlFor={subject.id} className="font-normal">
              {subject.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
