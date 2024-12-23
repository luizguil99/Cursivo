import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarUrl } from "@/utils/avatar";

function OnlineUsers() {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para obter iniciais do nome
  const getInitials = (user) => {
    if (!user) return "??";
    const name = user.nome || user.email;
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
    return user.nome || user.email?.split("@")[0];
  };

  // Carregar usuários online
  const loadOnlineUsers = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from("perfis")
        .select("*")
        .order("nome");

      if (error) throw error;

      // Simular status online (você pode implementar a lógica real depois)
      const usersWithStatus = users.map((user) => ({
        ...user,
        isOnline: Math.random() > 0.5, // Simulação
      }));

      setOnlineUsers(usersWithStatus);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOnlineUsers();

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadOnlineUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-72 h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Pessoas</h2>
        <p className="text-sm text-muted-foreground">
          {onlineUsers.filter((u) => u.isOnline).length} online
        </p>
      </div>
      <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="p-2 space-y-1">
          {onlineUsers
            .filter((user) => user.id !== currentUser?.id)
            .map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={getAvatarUrl(user)}
                      alt={getDisplayName(user)}
                    />
                    <AvatarFallback className="bg-primary/10">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <Badge
                      variant="default"
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 p-0 bg-green-500 border-2 border-background"
                    />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {getDisplayName(user)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default OnlineUsers;
