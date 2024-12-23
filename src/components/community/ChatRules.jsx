import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ChatRules = ({ isOpen, onClose, isInitialPopup = false }) => {
  const [accepted, setAccepted] = useState(false);

  const handleAcceptRules = () => {
    if (accepted) {
      localStorage.setItem('chatRulesAccepted', 'true');
      onClose();
    }
  };

  const rules = [
    {
      title: "1. Respeito Mútuo",
      description: "Trate todos os participantes com respeito. Não serão tolerados insultos, discriminação ou assédio.",
    },
    {
      title: "2. Conteúdo Apropriado",
      description: "Compartilhe apenas conteúdo adequado e relacionado aos estudos. Evite spam e conteúdo impróprio.",
    },
    {
      title: "3. Linguagem",
      description: "Use linguagem apropriada e profissional. Evite palavrões e gírias excessivas.",
    },
    {
      title: "4. Privacidade",
      description: "Respeite a privacidade dos outros. Não compartilhe informações pessoais sem autorização.",
    },
    {
      title: "5. Direitos Autorais",
      description: "Respeite os direitos autorais. Não compartilhe conteúdo protegido sem permissão.",
    },
    {
      title: "6. Moderação",
      description: "Os moderadores podem remover mensagens inadequadas e banir usuários que violarem as regras.",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={isInitialPopup ? undefined : onClose}>
      <DialogContent className={cn(
        "max-w-2xl",
        isInitialPopup && "sm:max-w-[600px]"
      )}>
        <Card className="p-6 bg-white/5 backdrop-blur-sm border-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Regras do Chat</h2>
              <p className="text-sm text-muted-foreground">
                Para manter um ambiente de aprendizado saudável e produtivo, siga estas regras:
              </p>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {rules.map((rule) => (
                  <div key={rule.title} className="space-y-2 bg-background/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground">{rule.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {isInitialPopup && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="accept-rules" 
                  checked={accepted} 
                  onCheckedChange={setAccepted}
                  className="border-[#FFCE00] data-[state=checked]:bg-[#FFCE00] data-[state=checked]:text-black"
                />
                <label
                  htmlFor="accept-rules"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Eu li e aceito as regras do chat
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              {isInitialPopup ? (
                <Button 
                  onClick={handleAcceptRules}
                  disabled={!accepted}
                  className="bg-[#FFCE00] text-black hover:bg-[#FFCE00]/90 disabled:opacity-50"
                >
                  Aceitar e Continuar
                </Button>
              ) : (
                <Button onClick={onClose}>Entendi</Button>
              )}
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRules;
