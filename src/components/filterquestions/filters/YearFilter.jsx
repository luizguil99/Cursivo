import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Gera anos de 2010 até o ano atual
const YEARS = Array.from(
  { length: new Date().getFullYear() - 2009 },
  (_, i) => 2010 + i
).reverse();

// Componente de filtro por ano
export default function YearFilter({ value, onChange }) {
  return (
    <div className="space-y-3">
      <Label className="text-base">Ano da Questão</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o ano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos os anos</SelectItem>
          {YEARS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
