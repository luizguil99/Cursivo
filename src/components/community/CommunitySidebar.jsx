import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Users,
  MessageSquare,
  Bookmark,
  Settings,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

const menuItems = [
  {
    icon: Home,
    label: "Home",
    path: "/courses",
  },
  {
    icon: Users,
    label: "Meus Grupos",
    path: "/community/groups",
  },
  {
    icon: MessageSquare,
    label: "Discussões",
    path: "/community/discussions",
  },
  {
    icon: Bookmark,
    label: "Salvos",
    path: "/community/saved",
  },
  {
    icon: TrendingUp,
    label: "Tendências",
    path: "/community/trending",
  },
];

const CommunitySidebar = () => {
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
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-foreground">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
          <Separator />
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-foreground">Configurações</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="text-foreground">Ajuda</span>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunitySidebar;
