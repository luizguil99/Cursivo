import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import TopNav from "@/components/layouts/TopNav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SimulationHistory() {
  const { currentUser } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimulationHistory() {
      try {
        const { data, error } = await supabase
          .from("historico_simulados")
          .select("*")
          .eq("usuario_id", currentUser.id)
          .order("finalizado_em", { ascending: false });

        if (error) throw error;
        setSimulations(data);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchSimulationHistory();
    }
  }, [currentUser]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="Histórico de Simulados" />

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Meus Simulados</CardTitle>
              <CardDescription>
                Histórico completo dos seus simulados realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Simulado</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Nota TRI</TableHead>
                      <TableHead>Nota Tradicional</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulations.map((sim) => (
                      <TableRow key={sim.id}>
                        <TableCell>{sim.titulo_simulado}</TableCell>
                        <TableCell>{formatDate(sim.finalizado_em)}</TableCell>
                        <TableCell>
                          <span className="font-medium text-[#F3C92C]">
                            {sim.pontuacao_tri.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-500">
                            {sim.pontuacao}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SimulationHistory;
