import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Users,
  MessagesSquare,
  Settings,
  HelpCircle,
} from "lucide-react";

const menuItems = [
  {
    icon: MessageSquare,
    label: "Publicações",
    path: "/community",
  },
  {
    icon: MessagesSquare,
    label: "Chat em Tempo Real",
    path: "/community/discussions",
  },
  {
    icon: Users,
    label: "Grupos",
    path: "/community/groups",
  },
  {
    icon: HelpCircle,
    label: "Ajuda",
    path: "/community/help",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/community/settings",
  },
];

const CommunitySidebar = () => {
  const location = useLocation();

  return (
    <div className="h-screen w-64 border-r border-border bg-background">
      <ScrollArea className="h-full px-4 py-6">
        <div className="space-y-4">
          <div className="px-3">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Comunidade</h2>
            <p className="text-sm text-muted-foreground">
              Conecte-se e aprenda com outros estudantes
            </p>
          </div>
          <Separator />
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-foreground">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
          <Separator />
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunitySidebar;
