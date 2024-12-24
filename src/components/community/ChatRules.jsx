import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, Shield, Lock, Copyright, FileWarning, UserCheck } from "lucide-react";

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
      icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
      title: "1. Respeito Mútuo",
      description: "Trate todos os participantes com respeito. Não serão tolerados insultos, discriminação ou assédio.",
      color: "border-l-emerald-500",
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      title: "2. Conteúdo Apropriado",
      description: "Compartilhe apenas conteúdo adequado e relacionado aos estudos. Evite spam e conteúdo impróprio.",
      color: "border-l-blue-500",
    },
    {
      icon: <FileWarning className="w-5 h-5 text-orange-500" />,
      title: "3. Linguagem",
      description: "Use linguagem apropriada e profissional. Evite palavrões e gírias excessivas.",
      color: "border-l-orange-500",
    },
    {
      icon: <Lock className="w-5 h-5 text-violet-500" />,
      title: "4. Privacidade",
      description: "Respeite a privacidade dos outros. Não compartilhe informações pessoais sem autorização.",
      color: "border-l-violet-500",
    },
    {
      icon: <Copyright className="w-5 h-5 text-pink-500" />,
      title: "5. Direitos Autorais",
      description: "Respeite os direitos autorais. Não compartilhe conteúdo protegido sem permissão.",
      color: "border-l-pink-500",
    },
    {
      icon: <Shield className="w-5 h-5 text-red-500" />,
      title: "6. Moderação",
      description: "Os moderadores podem remover mensagens inadequadas e banir usuários que violarem as regras.",
      color: "border-l-red-500",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={isInitialPopup ? undefined : onClose}>
      <DialogContent className={cn(
        "max-w-2xl p-0 gap-0",
        isInitialPopup && "sm:max-w-[600px]"
      )}>
        <div className="relative">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-[#FFCE00] to-[#FFCE00]/80 p-6 rounded-t-lg">
            <h2 className="text-2xl font-bold text-black mb-2">Regras do Chat</h2>
            <p className="text-sm text-black/80">
              Para manter um ambiente de aprendizado saudável e produtivo, siga estas regras:
            </p>
          </div>

          {/* Corpo com as regras */}
          <div className="p-6 space-y-6">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.title}
                    className={cn(
                      "p-4 rounded-lg bg-card border-l-4 transition-all",
                      "hover:translate-x-1 hover:shadow-md",
                      rule.color
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {rule.icon}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-foreground">{rule.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer com checkbox e botão */}
            {isInitialPopup && (
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="accept-rules" 
                    checked={accepted} 
                    onCheckedChange={setAccepted}
                    className="border-[#FFCE00] data-[state=checked]:bg-[#FFCE00] data-[state=checked]:text-black h-5 w-5"
                  />
                  <label
                    htmlFor="accept-rules"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Eu li e aceito as regras do chat
                  </label>
                </div>

                <div className="flex justify-end space-x-2">
                  {isInitialPopup ? (
                    <Button 
                      onClick={handleAcceptRules}
                      disabled={!accepted}
                      size="lg"
                      className="bg-[#FFCE00] text-black hover:bg-[#FFCE00]/90 disabled:opacity-50"
                    >
                      Aceitar e Continuar
                    </Button>
                  ) : (
                    <Button onClick={onClose} size="lg">Entendi</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatRules;
