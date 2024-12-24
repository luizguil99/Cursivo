import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Sparkles } from "lucide-react";

// Lista de eventos mockada (depois você pode substituir por dados reais)
const events = [
  {
    title: "Encontro de Estudos",
    time: "14:00",
    participants: 8,
  },
  {
    title: "Tira Dúvidas",
    time: "16:30",
    participants: 12,
  },
];

function DailyEvents() {
  const [showEvents, setShowEvents] = useState(true);

  useEffect(() => {
    const shouldShow = localStorage.getItem("showDailyEvents");
    if (shouldShow !== null) {
      setShowEvents(shouldShow === "true");
    }
  }, []);

  if (!showEvents) return null;

  return (
    <Card className="mt-4 mx-4 mb-4">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <h3 className="font-medium text-sm">Eventos de Hoje</h3>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{event.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {event.time}
                <span>•</span>
                <Users className="h-3 w-3" />
                {event.participants}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6">
              Entrar
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default DailyEvents;
