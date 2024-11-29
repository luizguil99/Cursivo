import React, { useState } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import FloatingAIChat from "./FloatingAIChat";

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 w-full max-w-2xl mx-4 rounded-lg shadow-lg h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <FloatingAIChat onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg border-2 border-yellow-400 bg-white hover:bg-yellow-50 hover:border-yellow-500 transition-all duration-200"
      >
        <Bot className="h-6 w-6 text-yellow-600" />
      </Button>
    </>
  );
};

export default FloatingChatButton;
