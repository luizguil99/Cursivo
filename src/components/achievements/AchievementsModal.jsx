import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

// Componente que exibe o modal de conquistas
export function AchievementsModal({ 
  isOpen, 
  onClose, 
  achievement 
}) {
  // Efeito de confete quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      // Configuração do confete para um efeito mais festivo
      const duration = 3 * 1000; // 3 segundos
      const end = Date.now() + duration;

      const colors = ["#FFD700", "#FFA500", "#FF6347"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [isOpen]);

  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Nova Conquista!
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {/* Ícone da conquista */}
          <div className="p-4 rounded-full bg-yellow-100">
            <Trophy className={`h-16 w-16 text-yellow-500`} />
          </div>

          {/* Nome da conquista */}
          <h3 className="text-xl font-semibold text-center">
            {achievement.nome}
          </h3>

          {/* Descrição da conquista */}
          <p className="text-center text-gray-600">
            {achievement.descricao}
          </p>

          {/* Botão de fechar */}
          <Button 
            onClick={onClose}
            className="mt-4"
            variant="outline"
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
