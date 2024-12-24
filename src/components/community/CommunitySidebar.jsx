import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Home,
  Newspaper,
  MessagesSquare,
} from "lucide-react";

const menuItems = [
  {
    icon: Home,
    label: "Home",
    path: "/courses",
  },
  {
    icon: Newspaper,
    label: "Publicações",
    path: "/community",
  },
  {
    icon: MessagesSquare,
    label: "Bate Papo",
    path: "/community/discussions",
  },
];

const CommunitySidebar = () => {
  const location = useLocation();

  return (
    <div className="h-screen w-64 border-r border-border bg-background">
      <ScrollArea className="h-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-yellow-500 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Comunidade</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Conecte-se e aprenda com outros estudantes
          </p>
          <Separator className="mb-6" />
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-11 text-sm"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunitySidebar;
