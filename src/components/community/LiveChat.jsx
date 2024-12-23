import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Smile,
  Image as ImageIcon,
  PlusCircle,
  ThumbsUp,
  MoreVertical,
  File,
  X,
  Download,
  Heart,
  Ban,
  Flag,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { s3Client } from "@/lib/s3Client";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAvatarUrl } from "@/utils/avatar";
import ChatRules from "./ChatRules";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function LiveChat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [likedMessages, setLikedMessages] = useState(() => {
    const saved = localStorage.getItem(`likedMessages_${currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [bannedUsers, setBannedUsers] = useState(() => {
    const saved = localStorage.getItem("bannedUsers");
    return saved ? JSON.parse(saved) : [];
  });
  const [showRules, setShowRules] = useState(false);
  const [showInitialRules, setShowInitialRules] = useState(() => {
    return !localStorage.getItem('chatRulesAccepted');
  });
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const initialLoadRef = useRef(false);

  const isAdmin = currentUser?.user_metadata?.isAdmin || false;
  const isBanned = bannedUsers.includes(currentUser?.id);

  const handleBanUser = async (userId) => {
    setBannedUsers((prev) => {
      const newBannedUsers = [...prev, userId];
      localStorage.setItem("bannedUsers", JSON.stringify(newBannedUsers));
      return newBannedUsers;
    });

    toast({
      title: "Usuário banido",
      description: "O usuário foi banido do chat por violar as regras.",
    });
  };

  const handleUnbanUser = (userId) => {
    setBannedUsers((prev) => {
      const newBannedUsers = prev.filter((id) => id !== userId);
      localStorage.setItem("bannedUsers", JSON.stringify(newBannedUsers));
      return newBannedUsers;
    });

    toast({
      title: "Usuário desbanido",
      description: "O usuário pode voltar a participar do chat.",
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isBanned) {
      toast({
        variant: "destructive",
        title: "Acesso bloqueado",
        description: "Você foi banido do chat por violar as regras.",
      });
      return;
    }
    // ... resto do código de envio de mensagem
  };

  // Função para rolar para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Função para carregar mensagens
  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Pegar IDs únicos dos usuários
      const userIds = [...new Set(messagesData.map((msg) => msg.user_id))];

      // Buscar dados dos usuários
      const { data: usersData } = await supabase
        .from("perfis")
        .select("*")
        .in("id", userIds);

      // Combinar mensagens com dados dos usuários
      const messagesWithUsers = messagesData.map((msg) => ({
        ...msg,
        perfil: usersData?.find((user) => user.id === msg.user_id),
      }));

      setMessages(messagesWithUsers);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLoadRef.current) {
      loadMessages();
      initialLoadRef.current = true;
    }

    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          if (payload.new.user_id !== currentUser?.id) {
            const { data: userData } = await supabase
              .from("perfis")
              .select("*")
              .eq("id", payload.new.user_id)
              .single();

            const newMessage = {
              ...payload.new,
              perfil: userData,
            };

            setMessages((prev) => [...prev, newMessage]);
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Função para enviar mensagem
  const uploadFile = async (file) => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive",
        });
        return null;
      }

      const fileExtension = file.name.split(".").pop();
      const fileName = `chat-files/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;

      // Criar o comando para upload
      const putCommand = new PutObjectCommand({
        Bucket: import.meta.env.VITE_MINIO_BUCKET,
        Key: fileName,
        ContentType: file.type,
      });

      // Gerar URL assinada para upload
      const signedUrl = await getSignedUrl(s3Client, putCommand, {
        expiresIn: 3600,
      });

      // Fazer upload do arquivo
      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Construir URL pública do arquivo
      const fileUrl = `https://${import.meta.env.VITE_MINIO_ENDPOINT}/${
        import.meta.env.VITE_MINIO_BUCKET
      }/${fileName}`;

      return {
        url: fileUrl,
        type: file.type,
        name: file.name,
      };
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível fazer upload do arquivo",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || loading) return;

    const messageContent = newMessage.trim();
    const fileToUpload = selectedFile;

    // Limpar inputs imediatamente
    setNewMessage("");
    removeSelectedFile();

    // Criar mensagem temporária
    const tempMessage = {
      id: Date.now().toString(),
      message: messageContent,
      user_id: currentUser?.id,
      created_at: new Date().toISOString(),
      perfil: currentUser,
      attachment_url: fileToUpload?.type.startsWith("image/")
        ? previewUrl
        : null,
      attachment_type: fileToUpload?.type,
      attachment_name: fileToUpload?.name,
    };

    // Atualizar UI imediatamente
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      let attachment = null;
      if (fileToUpload) {
        attachment = await uploadFile(fileToUpload);
        if (!attachment) return;
      }

      const { data: message, error } = await supabase
        .from("chat_messages")
        .insert({
          message: messageContent,
          user_id: currentUser?.id,
          attachment_url: attachment?.url,
          attachment_type: attachment?.type,
          attachment_name: attachment?.name,
        })
        .select()
        .single();

      if (error) throw error;

      const messageWithUser = {
        ...message,
        perfil: currentUser,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? messageWithUser : msg))
      );
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (imageUrl, imageName) => {
    setSelectedImage({ url: imageUrl, name: imageName });
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast({
        title: "Erro ao baixar arquivo",
        description: "Não foi possível fazer o download do arquivo",
        variant: "destructive",
      });
    }
  };

  const handleLikeMessage = (messageId) => {
    setLikedMessages((prev) => {
      const newLikes = {
        ...prev,
        [messageId]: !prev[messageId],
      };
      localStorage.setItem(`likedMessages_${currentUser?.id}`, JSON.stringify(newLikes));
      return newLikes;
    });
  };

  const renderAttachment = (msg) => {
    if (!msg.attachment_url) return null;

    if (msg.attachment_type?.startsWith("image/")) {
      return (
        <div className="mt-2 max-w-[300px]">
          <img
            src={msg.attachment_url}
            alt={msg.attachment_name || "Imagem"}
            className="rounded-lg w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() =>
              handleImageClick(msg.attachment_url, msg.attachment_name)
            }
          />
        </div>
      );
    }

    return (
      <a
        href={msg.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <File className="h-4 w-4" />
        {msg.attachment_name || "Arquivo"}
      </a>
    );
  };

  // Função para obter iniciais do nome
  const getInitials = (user) => {
    if (!user) return "??";
    const name = user.nome || user.email;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Função para obter nome de exibição
  const getDisplayName = (user) => {
    if (!user) return "Usuário Desconhecido";
    return user.nome || user.email;
  };

  // Função para formatar data
  const formatMessageDate = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const onEmojiClick = (emojiObject) => {
    const cursor = inputRef.current.selectionStart;
    const text =
      newMessage.slice(0, cursor) +
      emojiObject.emoji +
      newMessage.slice(cursor);
    setNewMessage(text);
    setTimeout(() => {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        cursor + emojiObject.emoji.length,
        cursor + emojiObject.emoji.length
      );
    }, 10);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatRules 
        isOpen={showInitialRules} 
        onClose={() => setShowInitialRules(false)} 
        isInitialPopup={true} 
      />
      <ChatRules 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
        isInitialPopup={false}
      />
      <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">Chat em Grupo</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRules(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4 mr-2" />
            Regras do Chat
          </Button>
          <span className="text-sm text-muted-foreground">
            {messages.length} mensagens
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-6 space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const isFirstMessageOfDay =
                  index === 0 ||
                  new Date(msg.created_at).toDateString() !==
                    new Date(messages[index - 1].created_at).toDateString();

                const isConsecutive =
                  index > 0 &&
                  messages[index - 1].perfil?.id === msg.perfil?.id &&
                  new Date(msg.created_at).getTime() -
                    new Date(messages[index - 1].created_at).getTime() <
                    300000;

                return (
                  <React.Fragment key={msg.id}>
                    {isFirstMessageOfDay && (
                      <div className="flex items-center gap-4 my-6">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "group flex items-start gap-2",
                        msg.perfil?.id === currentUser?.id
                          ? "flex-row-reverse"
                          : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "flex flex-col",
                          msg.perfil?.id === currentUser?.id
                            ? "items-end"
                            : "items-start"
                        )}
                      >
                        {!isConsecutive && (
                          <div className="flex items-center gap-2 mb-1">
                            {msg.perfil?.id === currentUser?.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-[#FFCE00]">
                                  Você
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  disse:
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-emerald-500">
                                  {getDisplayName(msg.perfil)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  disse:
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 group">
                          {msg.perfil?.id === currentUser?.id && (
                            <Avatar className="h-6 w-6 order-2">
                              <AvatarImage
                                src={
                                  currentUser?.user_metadata?.avatar_url ||
                                  getAvatarUrl(
                                    currentUser,
                                    currentUser?.user_metadata?.avatar_style,
                                    currentUser?.user_metadata?.avatar_seed
                                  )
                                }
                                alt={getDisplayName(currentUser)}
                              />
                              <AvatarFallback className="bg-primary/10">
                                {getInitials(currentUser)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2 max-w-[85%] break-words",
                              msg.perfil?.id === currentUser?.id
                                ? "bg-[#FFCE00] text-black rounded-br-lg order-1"
                                : "bg-accent hover:bg-accent/90 rounded-bl-lg"
                            )}
                          >
                            <p className="break-words text-sm leading-relaxed">
                              {msg.message}
                            </p>
                            {renderAttachment(msg)}
                          </div>
                          <button
                            onClick={() => handleLikeMessage(msg.id)}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-opacity",
                              likedMessages[msg.id] && "opacity-100 text-[#FFCE00]"
                            )}
                          >
                            {likedMessages[msg.id] ? (
                              <Heart className="h-4 w-4 fill-current" />
                            ) : (
                              <Heart className="h-4 w-4" />
                            )}
                          </button>
                          {isAdmin && msg.perfil?.id !== currentUser?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {bannedUsers.includes(msg.perfil?.id) ? (
                                  <DropdownMenuItem
                                    onClick={() => handleUnbanUser(msg.perfil?.id)}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Desbanir Usuário
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleBanUser(msg.perfil?.id)}
                                    className="text-red-500"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Banir Usuário
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatMessageDate(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={
                currentUser?.user_metadata?.avatar_url ||
                getAvatarUrl(
                  currentUser,
                  currentUser?.user_metadata?.avatar_style,
                  currentUser?.user_metadata?.avatar_seed
                )
              }
              alt={getDisplayName(currentUser)}
            />
            <AvatarFallback className="bg-primary/10">
              {getInitials(currentUser)}
            </AvatarFallback>
          </Avatar>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              fileInputRef.current.accept = "image/*";
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            {selectedFile ? (
              <div
                className={cn(
                  "flex items-center gap-2 bg-accent/50 px-4 py-2",
                  selectedFile.type.startsWith("image/")
                    ? "rounded-lg"
                    : "rounded-full"
                )}
              >
                {selectedFile.type.startsWith("image/") && previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm hover:bg-accent"
                      onClick={removeSelectedFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">
                      {selectedFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={removeSelectedFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-accent/50 rounded-full px-4 py-1">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 hover:bg-transparent"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="end">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      lazyLoadEmojis={true}
                      searchPlaceholder="Buscar emoji..."
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="icon"
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || loading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LiveChat;
