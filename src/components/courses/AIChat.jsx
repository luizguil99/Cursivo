import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/s3";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AIChat({ question, selectedAnswer, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const { currentUser } = useAuth();

  // Carregar ou criar chat
  useEffect(() => {
    const loadChat = async () => {
      if (!currentUser || !question) return;

      try {
        const chatId = `${currentUser.uid}_${question.id}`;
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
          setMessages(chatDoc.data().messages || []);
        } else if (question && selectedAnswer !== null) {
          const initialMessage = {
            role: "user",
            content: createInitialMessage(question, selectedAnswer),
          };

          const newChat = {
            userId: currentUser.uid,
            questionId: question.id,
            messages: [initialMessage],
          };

          await setDoc(chatRef, newChat);
          setMessages([initialMessage]);
          handleSendMessage(initialMessage.content, true);
        }
      } catch (error) {
        console.error("Erro ao carregar chat:", error);
      }
    };

    loadChat();
  }, [currentUser, question, selectedAnswer]);

  const createInitialMessage = (question, selectedAnswer) => {
    return (
      `Questão: ${question.question}\n` +
      `Alternativas:\n${question.options
        .map((opt, i) => `${String.fromCharCode(97 + i)}) ${opt}`)
        .join("\n")}\n` +
      `Resposta correta: ${String.fromCharCode(
        97 + question.correctAnswer
      )}\n` +
      `Resposta selecionada: ${String.fromCharCode(97 + selectedAnswer)}\n` +
      `${
        selectedAnswer === question.correctAnswer
          ? "Você acertou!"
          : "Você errou."
      }\n\n` +
      "Por favor, me explique detalhadamente esta questão, por que a resposta correta é a correta e por que as outras alternativas estão erradas."
    );
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result);
        };
        reader.readAsDataURL(file);

        const uploadedUrl = await uploadImage(file);
        setImageUrl(uploadedUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Erro ao fazer upload da imagem. Por favor, tente novamente.");
        setSelectedImage(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSendMessage = async (message, isInitial = false) => {
    if ((!message.trim() && !imageUrl) || isLoading) return;

    const newMessage = {
      role: "user",
      content: message,
      image: imageUrl,
    };

    try {
      setIsLoading(true);
      setMessages((prev) => [...prev, newMessage]);
      if (!isInitial) setInputMessage("");
      setSelectedImage(null);
      setImageUrl(null);

      const messagePayload = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um professor especialista em explicar questões de forma clara e didática. Explique de maneira detalhada e didática, usando exemplos quando necessário.",
          },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.image
              ? [
                  { type: "text", text: msg.content || "" },
                  { type: "image_url", image_url: { url: msg.image } },
                ]
              : msg.content,
          })),
          {
            role: "user",
            content: imageUrl
              ? [
                  { type: "text", text: message || "" },
                  { type: "image_url", image_url: { url: imageUrl } },
                ]
              : message,
          },
        ],
        max_tokens: 2000,
      };

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer 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",
          },
          body: JSON.stringify(messagePayload),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error?.message || "Erro na comunicação com a IA"
        );
      }

      const aiMessage = {
        role: "assistant",
        content: responseData.choices[0].message.content,
      };

      // Atualizar mensagens localmente
      const updatedMessages = [...messages, newMessage, aiMessage];
      setMessages(updatedMessages);

      // Salvar no Firestore
      if (currentUser && question) {
        const chatId = `${currentUser.uid}_${question.id}`;
        const chatRef = doc(db, "chats", chatId);
        await setDoc(chatRef, {
          userId: currentUser.uid,
          questionId: question.id,
          messages: updatedMessages,
        });
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Erro: ${
            error.message ||
            "Houve um erro ao processar sua mensagem. Por favor, tente novamente."
          }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!question || selectedAnswer === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-2xl mx-4 rounded-lg shadow-lg h-[80vh] flex flex-col border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Consultar com IA</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                    : "bg-muted mr-auto max-w-[80%]"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">
                  {message.content}
                </pre>
                {message.image && (
                  <img
                    src={message.image}
                    alt="Uploaded content"
                    className="mt-2 max-w-full rounded-lg"
                  />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted p-3 rounded-lg mr-auto max-w-[80%]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex flex-col gap-2"
          >
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="max-h-32 rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1"
                  onClick={() => {
                    setSelectedImage(null);
                    setImageUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isLoading || isUploading}
                className="flex-1"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  isUploading ||
                  (!inputMessage.trim() && !imageUrl)
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
