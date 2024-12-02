import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { uploadImage } from "@/lib/s3";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function FloatingAIChat({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const { currentUser } = useAuth();

  // Carregar chat
  useEffect(() => {
    const loadChat = async () => {
      if (!currentUser?.id) return;

      try {
        const chatId = `floating_${currentUser.id}`;
        
        // Buscar chat existente
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single();

        if (chatError && chatError.code !== 'PGRST116') { // PGRST116 = not found
          throw chatError;
        }

        if (chatData) {
          setMessages(chatData.mensagens || []);
        } else {
          // Criar novo chat
          const { error: insertError } = await supabase
            .from('chats')
            .insert({
              id: chatId,
              usuario_id: currentUser.id,
              mensagens: [],
              mensagem: ''
            });

          if (insertError) throw insertError;
          setMessages([]);
        }
      } catch (error) {
        console.error("Erro ao carregar chat:", error);
      }
    };

    loadChat();
  }, [currentUser]);

  const saveMessages = async (newMessages, lastMessage = '') => {
    if (!currentUser?.id) return;

    try {
      const chatId = `floating_${currentUser.id}`;
      const { error } = await supabase
        .from('chats')
        .update({ 
          mensagens: newMessages,
          mensagem: lastMessage,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar mensagens:", error);
    }
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

  const handleSendMessage = async (content = inputMessage) => {
    if ((!content.trim() && !imageUrl) || isLoading) return;

    const newMessage = {
      role: "user",
      content,
      image: imageUrl,
    };

    try {
      setIsLoading(true);
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      await saveMessages(updatedMessages, content);
      
      setInputMessage("");
      setSelectedImage(null);
      setImageUrl(null);

      const messagePayload = {
        model: import.meta.env.VITE_OPENAI_MODEL,
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
                  { type: "text", text: content || "" },
                  { type: "image_url", image_url: { url: imageUrl } },
                ]
              : content,
          },
        ],
        temperature: 0.7,
        max_tokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS),
      };

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
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

      // Atualizar mensagens localmente e salvar no Supabase
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);
      await saveMessages(newMessages, aiMessage.content);

    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      setMessages((prev) => [...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-background border-border">
      <CardHeader className="p-4 border-b border-border flex flex-row justify-between items-center space-y-0">
        <h2 className="text-lg font-bold text-foreground">Chat com IA</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg break-words ${
                    message.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Imagem enviada"
                      className="max-w-full h-auto rounded-lg mb-2"
                    />
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted max-w-[80%] p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Pensando...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {selectedImage && (
        <div className="px-4 py-2 border-t border-border">
          <div className="relative w-20 h-20">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={() => {
                setSelectedImage(null);
                setImageUrl(null);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <CardFooter className="p-4 border-t border-border">
        <div className="flex gap-2 w-full">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            className="shrink-0"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={() => handleSendMessage()}
            disabled={(!inputMessage.trim() && !imageUrl) || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
