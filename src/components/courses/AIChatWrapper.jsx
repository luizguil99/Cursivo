import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import AIChat from "./AIChat";

const AIChatWrapper = ({ question, selectedAnswer, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-2xl mx-4 rounded-lg shadow-lg h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <AuthProvider>
          <AIChat
            question={question}
            selectedAnswer={selectedAnswer}
            onClose={onClose}
          />
        </AuthProvider>
      </div>
    </div>
  );
};

export default AIChatWrapper;
