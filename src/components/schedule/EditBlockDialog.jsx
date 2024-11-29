import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const blockColors = [
  "#9333ea", // Roxo
  "#2563eb", // Azul
  "#16a34a", // Verde
  "#ca8a04", // Amarelo
  "#dc2626", // Vermelho
  "#db2777", // Rosa
  "#64748b", // Cinza
  "#0891b2", // Azul Claro
  "#4f46e5", // Índigo
  "#7c3aed", // Violeta
  "#c026d3", // Magenta
  "#e11d48", // Rosa Escuro
];

function EditBlockDialog({ open, onClose, block, onSave }) {
  const [editedBlock, setEditedBlock] = React.useState(block || {});

  React.useEffect(() => {
    if (block) {
      setEditedBlock(block);
    }
  }, [block]);

  const handleSave = () => {
    if (editedBlock.name.trim()) {
      onSave(editedBlock);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Bloco</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Bloco</Label>
            <Input
              id="name"
              value={editedBlock.name || ""}
              onChange={(e) =>
                setEditedBlock({ ...editedBlock, name: e.target.value })
              }
              placeholder="Ex: Estudo Individual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duração</Label>
            <Input
              id="duration"
              value={editedBlock.duration || ""}
              onChange={(e) =>
                setEditedBlock({ ...editedBlock, duration: e.target.value })
              }
              placeholder="Ex: 1h"
            />
          </div>
          <div className="space-y-4">
            <Label>Cor do Bloco</Label>
            <div 
              className="w-full h-16 rounded-lg border-4 transition-colors cursor-pointer hover:opacity-90 flex items-center justify-center text-gray-500"
              style={{ 
                borderColor: editedBlock.color || "#64748b"
              }}
            >
              Preview
            </div>
            <div className="grid grid-cols-6 gap-2">
              {blockColors.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-8 h-8 rounded-md transition-all hover:scale-105",
                    editedBlock.color === color && "ring-2 ring-black dark:ring-white"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setEditedBlock({ ...editedBlock, color })}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditBlockDialog;
