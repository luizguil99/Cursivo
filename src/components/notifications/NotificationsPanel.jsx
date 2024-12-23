import React, { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { 
  getNotificationsFromCache, 
  setNotificationsCache, 
  invalidateNotificationsCache 
} from "@/lib/notificationsCache";

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState(() => getNotificationsFromCache() || []);

  // Buscar notificações do Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      // Verificar cache
      const cachedData = getNotificationsFromCache();
      if (cachedData) {
        setNotifications(cachedData);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("notificacoes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        // Atualizar cache global
        setNotificationsCache(data || []);
        setNotifications(data || []);
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    };

    fetchNotifications();

    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel("notificacoes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificacoes",
        },
        () => {
          // Força atualização do cache quando receber nova notificação
          invalidateNotificationsCache();
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para formatar a data relativa (ex: "há 2 horas")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Agora mesmo";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Há ${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border mt-4">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-[#F3C92C]" />
          <h3 className="font-medium">Notificações Recentes</h3>
        </div>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="group border-l-2 border-[#F3C92C] pl-4 py-3 hover:bg-[#F3C92C]/5 rounded-r-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <span className="px-2 py-0.5 text-xs bg-[#F3C92C] text-background rounded-full">
                      {notification.type || "info"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
