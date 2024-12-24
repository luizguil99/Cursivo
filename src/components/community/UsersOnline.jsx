import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleUserRound } from "lucide-react";
import { getAvatarUrl, getInitials } from "@/utils/avatar";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersOnline() {
  const { currentUser } = useAuth();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden h-full">
      <div className="p-4 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <CircleUserRound className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Online</h3>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={getAvatarUrl(currentUser)}
                  alt={currentUser?.user_metadata?.nome || "Usuário"}
                />
                <AvatarFallback>
                  {getInitials(currentUser?.user_metadata?.nome || "Usuário")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {currentUser?.user_metadata?.nome || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground">Online agora</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
