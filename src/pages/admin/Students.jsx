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
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [status, setStatus] = useState("");
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
    if (loading) return; // Previne múltiplos cliques
    setLoading(true);
    setStatus("");

    try {
      setStatus("Verificando se o email já está cadastrado...");

      // 0. Verificar se o email já está cadastrado
      const { data: existingUser, error: searchError } = await supabase
        .from("perfis")
        .select("id, status")
        .eq("email", newStudent.email)
        .single();

      if (searchError && searchError.code !== "PGRST116") {
        // PGRST116 = não encontrado
        console.error("Erro ao verificar email:", searchError);
        throw new Error("Erro ao verificar disponibilidade do email");
      }

      if (existingUser) {
        const status = existingUser.status === "ativo" ? "ativo" : "inativo";
        throw new Error(
          `Este email já está cadastrado (status: ${status}). Por favor, use outro email.`
        );
      }

      setStatus("Criando novo usuário...");

      // 1. Criar usuário no Authentication do Supabase usando a API de admin
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${
              import.meta.env.VITE_SUPABASE_SERVICE_KEY
            }`,
          },
          body: JSON.stringify({
            email: newStudent.email,
            password: newStudent.password,
            email_confirm: true,
            user_metadata: {
              name: newStudent.name,
              role: "student",
            },
          }),
        }
      );

      const authData = await response.json();

      if (!response.ok) {
        // Tratamento de erros específicos da API
        const errorMessage =
          authData.msg || authData.message || authData.error_description;

        if (errorMessage?.includes("already")) {
          throw new Error(
            "Este email já está registrado no sistema de autenticação."
          );
        }

        if (errorMessage?.includes("password")) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }

        if (errorMessage?.includes("email")) {
          throw new Error("O email fornecido é inválido.");
        }

        throw new Error(errorMessage || "Erro ao criar usuário");
      }

      setStatus("Criando perfil do aluno...");

      if (authData?.id) {
        // API retorna id ao invés de user
        // 2. Adicionar informações do usuário na tabela perfis
        const { error: profileError } = await supabase.from("perfis").insert([
          {
            id: authData.id,
            nome: newStudent.name,
            email: newStudent.email,
            papel: "student",
            status: "ativo",
            status_plano: "ativo",
            plano: newStudent.plan,
            data_inicio_plano: new Date().toISOString(),
            data_fim_plano: calculatePlanEndDate(
              newStudent.plan
            )?.toISOString(),
          },
        ]);

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          throw new Error("Erro ao criar perfil do aluno");
        }

        setStatus("Inicializando progresso...");

        // 3. Inicializar progresso do usuário
        const { error: progressError } = await supabase
          .from("progresso_usuario")
          .insert([
            {
              usuario_id: authData.id,
              progresso: 0,
            },
          ]);

        if (progressError) {
          console.error("Erro ao inicializar progresso:", progressError);
        }

        setStatus("Finalizando...");

        toast({
          title: "✅ Aluno adicionado com sucesso!",
          description: `O aluno ${newStudent.name} (${newStudent.email}) foi cadastrado e já pode acessar a plataforma com a senha fornecida.`,
          duration: 5000,
        });

        setIsAddDialogOpen(false);
        setNewStudent({ name: "", email: "", password: "", plan: "mensal" });
        fetchStudents();
      }
    } catch (error) {
      console.error("Erro completo ao adicionar aluno:", error);

      // Mensagens de erro amigáveis
      let errorMessage = error.message;

      if (error.message?.includes("duplicate key")) {
        errorMessage =
          "Este email já está cadastrado. Por favor, use outro email.";
      } else if (error.message?.includes("network")) {
        errorMessage =
          "Erro de conexão. Verifique sua internet e tente novamente.";
      }

      setStatus(`Erro: ${errorMessage}`);

      toast({
        title: "❌ Erro ao adicionar aluno",
        description:
          errorMessage ||
          "Ocorreu um erro ao adicionar o aluno. Tente novamente.",
        variant: "destructive",
        duration: 5000,
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
            <div className="space-y-4 py-4">
              {status && (
                <div
                  className={`p-3 rounded-md text-sm ${
                    status.includes("Erro")
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {status}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  placeholder="Digite o nome completo"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  placeholder="Digite o email"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStudent.password}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, password: e.target.value })
                  }
                  placeholder="Digite a senha"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  value={newStudent.plan}
                  onValueChange={(value) =>
                    setNewStudent({ ...newStudent, plan: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teste">Teste (1 dia)</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="vitalicio">Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Aluno
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
