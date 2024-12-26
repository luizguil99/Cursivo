import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/courses/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getDiscussion,
  addComment,
  toggleDiscussionLike,
} from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export default function DiscussionDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscussion();
  }, [id]);

  const fetchDiscussion = async () => {
    try {
      const data = await getDiscussion(id);
      setDiscussion(data);
    } catch (error) {
      console.error("Erro ao carregar discussão:", error);
      toast({
        title: "Erro ao carregar discussão",
        description: "Não foi possível carregar os detalhes da discussão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await addComment(id, comment, currentUser.id);
      setComment("");
      await fetchDiscussion();
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro ao adicionar comentário",
        description: "Ocorreu um erro ao publicar seu comentário.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      await toggleDiscussionLike(id, currentUser.id);
      await fetchDiscussion();
    } catch (error) {
      console.error("Erro ao curtir/descurtir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua ação.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Discussão não encontrada</h2>
          <Link to="/community" className="text-blue-600 hover:text-blue-800">
            Voltar para a Comunidade
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TopNav />
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/community"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            ← Voltar para a Comunidade
          </Link>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{discussion.title}</h1>
              <div className="flex items-center text-sm text-gray-600">
                <span>
                  por{" "}
                  {discussion.user?.user_metadata?.name ||
                    discussion.user?.email}
                </span>
                <span className="mx-2">•</span>
                <span>{formatDate(discussion.created_at)}</span>
              </div>
            </div>

            <div className="prose max-w-none mb-6">
              <p>{discussion.content}</p>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <Button variant="outline" size="sm" onClick={handleLike}>
                {discussion.likes_count || 0} Curtidas
              </Button>
              <span className="text-sm text-gray-600">
                {discussion.comments?.length || 0} comentários
              </span>
            </div>
          </div>

          {/* Seção de Comentários */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Comentários</h2>

            {/* Formulário de Comentário */}
            <form onSubmit={handleSubmitComment} className="mb-8">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="mb-4"
                required
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar Comentário"}
              </Button>
            </form>

            {/* Lista de Comentários */}
            <div className="space-y-6">
              {discussion.comments?.map((comment) => (
                <div key={comment.id} className="border-b pb-4">
                  <div className="flex items-center mb-2">
                    <span className="font-medium">
                      {comment.user?.user_metadata?.name || comment.user?.email}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800">{comment.content}</p>
                </div>
              ))}

              {discussion.comments?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
