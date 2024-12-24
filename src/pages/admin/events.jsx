import React from "react";
import EventsManager from "@/components/admin/EventsManager";

function EventsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Eventos</h1>
        <p className="text-muted-foreground mt-2">
          Adicione, remova e gerencie os eventos da plataforma
        </p>
      </div>
      <div className="max-w-4xl">
        <EventsManager />
      </div>
    </div>
  );
}

export default EventsPage;
