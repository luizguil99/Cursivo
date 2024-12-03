import React, { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/courses/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/contexts/AccessContext";
import { useCommunity } from "@/contexts/CommunityContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createDiscussion, supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "@/components/community/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AVATAR_STYLES = [
  { value: "adventurer", label: "Aventureiro" },
  { value: "avataaars", label: "Cartoon" },
  { value: "bottts", label: "Robô" },
  { value: "micah", label: "Micah" },
];

export default function Community() {
  const { currentUser } = useAuth();
  const { loading: accessLoading, hasAccess } = useAccess();
  const {
    discussions,
    loading: discussionsLoading,
    refreshDiscussions,
  } = useCommunity();
  const [quickPost, setQuickPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getAvatarUrl = (user, style) => {
    if (!style && user?.user_metadata?.avatar_style) {
      style = user.user_metadata.avatar_style;
    }
    style = style || "adventurer";

    const seed = user?.id || user?.email || "default";
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(
      seed
    )}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const getUserDisplayName = (user) => {
    return user?.user_metadata?.name || user?.email || "Usuário";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarChange = async (style) => {
    try {
      const avatarUrl = getAvatarUrl(currentUser, style);
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_style: style,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      setDialogOpen(false);
      toast({
        description: "Avatar atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast({
        variant: "destructive",
        description: "Erro ao atualizar avatar.",
      });
    }
  };

  const handleQuickPost = async (e) => {
    e.preventDefault();
    if (!quickPost.trim()) return;

    setPosting(true);
    try {
      await createDiscussion(
        "Nova publicação", // title
        quickPost, // content
        currentUser.id // userId
      );

      // Limpa o input e atualiza a lista
      setQuickPost("");
      const editor = document.querySelector('.tiptap');
      if (editor) {
        editor.innerHTML = '';
      }
      refreshDiscussions();
      
      toast({
        description: "Publicação criada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar publicação:", error);
      toast({
        variant: "destructive",
        description: "Erro ao criar publicação.",
      });
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  if (accessLoading || discussionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <TopNav />
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                <div className="flex space-x-4">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <Avatar className="h-10 w-10 ring-2 ring-white hover:ring-blue-400 transition-all">
                          <AvatarImage
                            src={
                              currentUser?.user_metadata?.avatar_url ||
                              getAvatarUrl(currentUser)
                            }
                            alt={getUserDisplayName(currentUser)}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {getInitials(getUserDisplayName(currentUser))}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Escolha seu avatar</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        {AVATAR_STYLES.map((style) => (
                          <button
                            key={style.value}
                            onClick={() => handleAvatarChange(style.value)}
                            className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg border-2 border-transparent hover:border-blue-200 transition-all"
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              <AvatarImage
                                src={getAvatarUrl(currentUser, style.value)}
                              />
                            </Avatar>
                            <span className="text-sm font-medium">
                              {style.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="flex-1">
                    <form onSubmit={handleQuickPost}>
                      <RichTextEditor
                        value={quickPost}
                        onChange={setQuickPost}
                        placeholder="O que você está pensando?"
                      />
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="submit"
                          disabled={posting || !quickPost.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {posting ? "Publicando..." : "Publicar"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10 ring-2 ring-white">
                        <AvatarImage
                          src={
                            discussion?.user_metadata?.avatar_url ||
                            getAvatarUrl(discussion)
                          }
                          alt={getUserDisplayName(discussion)}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {getInitials(getUserDisplayName(discussion))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(discussion)}
                          </p>
                          <span className="text-sm text-gray-500">
                            {formatDate(discussion.created_at)}
                          </span>
                        </div>
                        <div
                          className="mt-1 text-sm text-gray-700 break-words"
                          dangerouslySetInnerHTML={{
                            __html: discussion.content,
                          }}
                        />
                        <div className="mt-4 flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs">Curtir</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">Comentar</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600">
                            <Share2 className="h-4 w-4" />
                            <span className="text-xs">Compartilhar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
