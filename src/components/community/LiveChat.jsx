import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function LiveChat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // Função para carregar mensagens
  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, user:user_id(id, email, user_metadata)")
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase.from("chat_messages").insert([
        {
          message: newMessage.trim(),
          user_id: currentUser.id,
        },
      ]);

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  // Efeito para carregar mensagens iniciais
  useEffect(() => {
    loadMessages();

    // Inscrever-se para atualizações em tempo real
    const subscription = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMessage = payload.new;
          // Buscar informações do usuário para a nova mensagem
          supabase
            .from("chat_messages")
            .select("*, user:user_id(id, email, user_metadata)")
            .eq("id", newMessage.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages((prev) => [...prev, data]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Função para formatar data
  const formatMessageDate = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  // Função para obter iniciais do nome
  const getInitials = (user) => {
    if (!user) return "??";
    const name = user.user_metadata?.name || user.email;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Função para obter nome de exibição
  const getDisplayName = (user) => {
    if (!user) return "Usuário Desconhecido";
    return user.user_metadata?.name || user.email;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Carregando mensagens...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.user?.id === currentUser?.id
                      ? "flex-row-reverse"
                      : "flex-row"
                  }`}
                >
                  <Avatar>
                    <AvatarImage
                      src={msg.user?.user_metadata?.avatar_url}
                      alt={getDisplayName(msg.user)}
                    />
                    <AvatarFallback>{getInitials(msg.user)}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col ${
                      msg.user?.id === currentUser?.id
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        msg.user?.id === currentUser?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {getDisplayName(msg.user)} •{" "}
                      {formatMessageDate(msg.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default LiveChat;
