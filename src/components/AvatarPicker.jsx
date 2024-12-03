import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateUserAvatar } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

const AVATAR_STYLES = [
  { value: 'adventurer', label: 'Aventureiro' },
  { value: 'avataaars', label: 'Cartoon' },
  { value: 'bottts', label: 'Robô' },
  { value: 'micah', label: 'Micah' }
];

export default function AvatarPicker({ user, currentStyle, onAvatarChange }) {
  const { toast } = useToast();

  const handleStyleSelect = async (style) => {
    try {
      const newAvatarUrl = await updateUserAvatar(user.id, style);
      if (onAvatarChange) {
        onAvatarChange(newAvatarUrl);
      }
      toast({
        description: "Avatar atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Erro ao atualizar avatar.",
      });
    }
  };

  const getPreviewUrl = (style) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(user.id)}&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer">
          <Avatar className="h-10 w-10 ring-2 ring-white hover:ring-blue-400 transition-all">
            <AvatarImage
              src={user?.user_metadata?.avatar_url}
              alt={user?.user_metadata?.name || user?.email}
              className="object-cover"
            />
            <AvatarFallback>
              {user?.user_metadata?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 w-64">
        <div className="text-sm text-center mb-2 text-muted-foreground">
          Escolha seu avatar
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AVATAR_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.value}
              onClick={() => handleStyleSelect(style.value)}
              className="flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-accent rounded-lg"
            >
              <Avatar className="h-16 w-16 mb-1">
                <AvatarImage src={getPreviewUrl(style.value)} />
              </Avatar>
              <span className="text-xs mt-1">{style.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
