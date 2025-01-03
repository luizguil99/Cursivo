import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SubjectFilter from "./filters/SubjectFilter";
import DifficultyFilter from "./filters/DifficultyFilter";
import YearFilter from "./filters/YearFilter";
import TopicFilter from "./filters/TopicFilter";
import ExamBoardFilter from "./filters/ExamBoardFilter";

// Componente do drawer de filtros
export default function FilterDrawer({
  open,
  onClose,
  filters,
  onUpdateFilters,
  onClearFilters,
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>
            Refine sua busca usando os filtros abaixo
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Filtro por Matéria */}
          <SubjectFilter
            value={filters.subject}
            onChange={(value) => onUpdateFilters("subject", value)}
          />
          <Separator />

          {/* Filtro por Dificuldade */}
          <DifficultyFilter
            value={filters.difficulty}
            onChange={(value) => onUpdateFilters("difficulty", value)}
          />
          <Separator />

          {/* Filtro por Ano */}
          <YearFilter
            value={filters.year}
            onChange={(value) => onUpdateFilters("year", value)}
          />
          <Separator />

          {/* Filtro por Tópico */}
          <TopicFilter
            value={filters.topics}
            subject={filters.subject}
            onChange={(value) => onUpdateFilters("topics", value)}
          />
          <Separator />

          {/* Filtro por Banca */}
          <ExamBoardFilter
            value={filters.examBoard}
            onChange={(value) => onUpdateFilters("examBoard", value)}
          />
        </div>

        <SheetFooter className="mt-6">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={onClose}>Aplicar Filtros</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
