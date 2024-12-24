import React from "react";
import TopNav from "@/components/TopNav";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import LiveChat from "@/components/community/LiveChat";
import UsersOnline from "@/components/community/UsersOnline";
import { Badge } from "@/components/ui/badge";
import { MessagesSquare, Users, MessageCircle, Bell, Calendar, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stats = [
  {
    icon: Users,
    label: "Usuários Online",
    value: "12",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    icon: MessageCircle,
    label: "Mensagens Hoje",
    value: "145",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Calendar,
    label: "Eventos Hoje",
    value: "3",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
];

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
  {
    title: "Debate em Grupo",
    time: "19:00",
    participants: 15,
  },
];

export default function Discussions() {
  return (
    <div className="flex min-h-screen bg-background">
      <CommunitySidebar />
      <div className="flex-1">
        <TopNav />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <MessagesSquare className="h-7 w-7 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Bate Papo</h1>
                <p className="text-sm text-muted-foreground">
                  Converse com outros estudantes em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              </div>
              <Badge variant="outline" className="bg-green-50 px-3 py-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mb-6">
            {stats.map((stat, index) => (
              <Card key={index} className="col-span-2 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* Chat principal */}
            <div className="col-span-9">
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <h2 className="font-medium">Chat em Grupo</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Input
                          placeholder="Buscar nas mensagens..."
                          className="w-64 pl-8"
                        />
                        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Ao Vivo
                      </Badge>
                    </div>
                  </div>
                </div>
                <LiveChat />
              </Card>
            </div>
            {/* Sidebar direita */}
            <div className="col-span-3 space-y-4">
              <UsersOnline />
              
              {/* Eventos do dia */}
              <Card>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-medium">Eventos de Hoje</h3>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver todos
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {event.time}
                          <span>•</span>
                          <Users className="h-3 w-3" />
                          {event.participants} participantes
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Entrar
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
