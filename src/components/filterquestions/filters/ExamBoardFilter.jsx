import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Lista de bancas examinadoras
const EXAM_BOARDS = [
  { id: "enem", label: "ENEM" },
  { id: "vunesp", label: "VUNESP" },
  { id: "fuvest", label: "FUVEST" },
  { id: "unicamp", label: "UNICAMP" },
  { id: "unesp", label: "UNESP" },
  { id: "fgv", label: "FGV" },
  { id: "cespe", label: "CESPE/CEBRASPE" },
  { id: "cesgranrio", label: "CESGRANRIO" },
];

// Componente de filtro por banca
export default function ExamBoardFilter({ value = [], onChange }) {
  const handleBoardChange = (boardId) => {
    const newValue = value.includes(boardId)
      ? value.filter((id) => id !== boardId)
      : [...value, boardId];
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <Label className="text-base">Banca Examinadora</Label>
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-3">
          {EXAM_BOARDS.map((board) => (
            <div key={board.id} className="flex items-center space-x-2">
              <Checkbox
                id={board.id}
                checked={value.includes(board.id)}
                onCheckedChange={() => handleBoardChange(board.id)}
              />
              <Label htmlFor={board.id} className="font-normal">
                {board.label}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
