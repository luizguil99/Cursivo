import React from "react";
import LiveChat from "@/components/community/LiveChat";
import OnlineUsers from "@/components/community/OnlineUsers";
import DailyEvents from "@/components/community/DailyEvents";
import ChatLayout from "@/components/layouts/ChatLayout";
import { Badge } from "@/components/ui/badge";
import { MessagesSquare } from "lucide-react";

function Discussions() {
  return (
    <ChatLayout>
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <MessagesSquare className="h-7 w-7 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Bate Papo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Converse com outros estudantes em tempo real
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 px-3 py-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </div>
            </Badge>
          </div>
        </div>

        {/* Chat e Usuários Online */}
        <div className="flex h-[calc(100vh-12rem)] bg-background/50 backdrop-blur-sm rounded-lg shadow-lg border overflow-hidden">
          <div className="w-72 border-r">
            <div className="h-full flex flex-col">
              <OnlineUsers />
              <DailyEvents />
            </div>
          </div>
          <div className="flex-1">
            <LiveChat />
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}

export default Discussions;
