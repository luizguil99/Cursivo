import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CourseNotifications() {
  const [notifications, setNotifications] = useState([]);

  // Buscar notificações do Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notificacoes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    };

    fetchNotifications();

    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel('notificacoes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notificacoes' 
        }, 
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para formatar o tempo relativo
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "Agora mesmo";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border mt-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Notificações</h3>
          <span className="px-2 py-0.5 text-xs bg-[#F3C92C] text-background rounded-full">
            {notifications.length} novas
          </span>
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
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <span className="px-2 py-0.5 text-xs bg-[#F3C92C] text-background rounded-full">
                      {notification.type || "Novo"}
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
