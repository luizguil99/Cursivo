import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { PlusCircle } from "lucide-react";

// Função auxiliar para calcular a data de término do plano
function calculatePlanEndDate(plan) {
  const now = new Date();
  switch (plan) {
    case "teste":
      return new Date(now.setDate(now.getDate() + 1)); // Plano de 1 dia
    case "mensal":
      return new Date(now.setMonth(now.getMonth() + 1));
    case "semestral":
      return new Date(now.setMonth(now.getMonth() + 6));
    case "anual":
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case "vitalicio":
      return null; // Plano vitalício não expira
    default:
      return new Date(now.setMonth(now.getMonth() + 1));
  }
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    password: "",
    plan: "mensal", // default plan
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Buscar apenas usuários que não são admin
      const { data: studentsData, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("papel", "student");

      if (error) throw error;

      setStudents(studentsData);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast({
        title: "Erro ao buscar alunos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateStudent = async (student) => {
    if (
      !window.confirm(
        `Tem certeza que deseja ${
          student.status === "ativo" ? "desativar" : "reativar"
        } o aluno ${student.email}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const newStatus = student.status === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase
        .from("perfis")
        .update({
          status: newStatus,
          status_plano: newStatus,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", student.id);

      if (error) throw error;

      // Atualizar estado local
      setStudents(
        students.map((s) =>
          s.id === student.id
            ? {
                ...s,
                status: newStatus,
                status_plano: newStatus,
              }
            : s
        )
      );

      toast({
        title: `Aluno ${
          student.status === "ativo" ? "desativado" : "reativado"
        } com sucesso!`,
        description:
          student.status === "ativo"
            ? "O acesso do aluno foi revogado."
            : "O acesso do aluno foi restaurado.",
      });
    } catch (error) {
      console.error("Erro ao modificar status do aluno:", error);
      toast({
        title: "Erro ao modificar status",
        description: "Ocorreu um erro ao tentar modificar o status do aluno.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar usuário no Authentication do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStudent.email,
        password: newStudent.password,
        options: {
          data: {
            name: newStudent.name,
            role: 'student'
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Auto-confirmar o email no ambiente self-hosted
        const { error: confirmError } = await supabase.rpc('confirm_user', {
          user_id: authData.user.id
        });

        if (confirmError) {
          console.error("Erro ao confirmar email:", confirmError);
        }

        // 3. Adicionar informações do usuário na tabela perfis
        const { error: profileError } = await supabase.from("perfis").insert([
          {
            id: authData.user.id,
            nome: newStudent.name,
            email: newStudent.email,
            papel: "student",
            status: "ativo",
            status_plano: "ativo",
            plano: newStudent.plan,
            data_inicio_plano: new Date().toISOString(),
            data_fim_plano: calculatePlanEndDate(newStudent.plan)?.toISOString(),
          },
        ]);

        if (profileError) {
          // Se houver erro ao criar o perfil, tentar deletar o usuário criado
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }

        toast({
          title: "Aluno adicionado com sucesso!",
          description: "O aluno já pode acessar a plataforma.",
        });

        setIsAddDialogOpen(false);
        setNewStudent({ name: "", email: "", password: "", plan: "mensal" });
        fetchStudents();
      }
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error);
      toast({
        title: "Erro ao adicionar aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Alunos</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Aluno
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.id}
                className={student.status === "inativo" ? "bg-gray-50" : ""}
              >
                <TableCell>{student.nome}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.plano || "N/A"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      student.status === "ativo"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {student.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  {student.data_fim_plano
                    ? new Date(student.data_fim_plano).toLocaleDateString()
                    : student.plano === "vitalicio"
                    ? "Nunca"
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {student.ultimo_login
                    ? new Date(student.ultimo_login).toLocaleDateString()
                    : "Nunca acessou"}
                </TableCell>
                <TableCell>
                  <Button
                    variant={
                      student.status === "ativo" ? "destructive" : "outline"
                    }
                    size="sm"
                    onClick={() => handleDeactivateStudent(student)}
                    className={
                      student.status === "ativo"
                        ? ""
                        : "text-green-600 border-green-600 hover:bg-green-50"
                    }
                  >
                    {student.status === "ativo" ? "Desativar" : "Reativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Aluno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStudent}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStudent.password}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, password: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="plan">Plano</Label>
                <select
                  id="plan"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newStudent.plan}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, plan: e.target.value })
                  }
                >
                  <option value="teste">Teste (1 dia)</option>
                  <option value="mensal">Mensal</option>
                  <option value="semestral">Semestral (6 meses)</option>
                  <option value="anual">Anual</option>
                  <option value="vitalicio">Vitalício</option>
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Adicionando..." : "Adicionar Aluno"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
