import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateUserAvatar } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const AVATAR_STYLES = [
  {
    value: "adventurer",
    label: "Aventureiro",
    seeds: ["Felix", "Luna", "Max", "Nova", "Leo", "Zoe", "Kai", "Mia"],
  },
  {
    value: "avataaars",
    label: "Cartoon",
    seeds: [
      "Toon1",
      "Toon2",
      "Toon3",
      "Toon4",
      "Toon5",
      "Toon6",
      "Toon7",
      "Toon8",
    ],
  },
  {
    value: "bottts",
    label: "Robô",
    seeds: ["Bot1", "Bot2", "Bot3", "Bot4", "Bot5", "Bot6", "Bot7", "Bot8"],
  },
  {
    value: "micah",
    label: "Micah",
    seeds: [
      "Micah1",
      "Micah2",
      "Micah3",
      "Micah4",
      "Micah5",
      "Micah6",
      "Micah7",
      "Micah8",
    ],
  },
  {
    value: "pixel-art",
    label: "Pixel Art",
    seeds: [
      "Pixel1",
      "Pixel2",
      "Pixel3",
      "Pixel4",
      "Pixel5",
      "Pixel6",
      "Pixel7",
      "Pixel8",
    ],
  },
  {
    value: "personas",
    label: "Personas",
    seeds: [
      "Person1",
      "Person2",
      "Person3",
      "Person4",
      "Person5",
      "Person6",
      "Person7",
      "Person8",
    ],
  },
];

export default function AvatarPicker({ user, currentStyle, onAvatarChange }) {
  const { toast } = useToast();
  const [selectedStyle, setSelectedStyle] = useState(AVATAR_STYLES[0].value);

  const getAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const handleStyleSelect = async (style, seed) => {
    try {
      const newAvatarUrl = getAvatarUrl(style, seed);
      await updateUserAvatar(user.id, newAvatarUrl);
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
      <DropdownMenuContent className="p-4 w-[350px]">
        <div className="space-y-4">
          <div className="text-sm text-center mb-2 text-muted-foreground">
            Escolha seu avatar
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedStyle === style.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {AVATAR_STYLES.find((s) => s.value === selectedStyle)?.seeds.map(
              (seed) => {
                const avatarUrl = getAvatarUrl(selectedStyle, seed);
                return (
                  <button
                    key={seed}
                    onClick={() => handleStyleSelect(selectedStyle, seed)}
                    className="relative rounded-full overflow-hidden w-12 h-12 ring-2 ring-offset-2 transition-all hover:ring-primary"
                  >
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${seed}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              }
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
