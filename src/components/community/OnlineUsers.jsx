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

      const usersWithStatus = users.map((user) => ({
        ...user,
        isOnline: Math.random() > 0.5,
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
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background/50">
        <h2 className="font-medium">Pessoas</h2>
        <p className="text-sm text-muted-foreground">
          {onlineUsers.filter((u) => u.isOnline).length} online
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            onlineUsers
              .filter((user) => user.id !== currentUser?.id)
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getAvatarUrl(user)}
                        alt={getDisplayName(user)}
                      />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {getDisplayName(user)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default OnlineUsers;
