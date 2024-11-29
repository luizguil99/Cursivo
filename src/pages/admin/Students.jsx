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
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
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
  const auth = getAuth();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      // Busca apenas usuários que não são admin
      const q = query(usersRef, where("role", "!=", "admin"));
      const studentsSnapshot = await getDocs(q);

      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
      !window.confirm(`Tem certeza que deseja ${student.status === 'active' ? 'desativar' : 'reativar'} o aluno ${student.email}?`)
    ) {
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore();

      // Atualizar status no Firestore
      await setDoc(
        doc(db, "users", student.id),
        {
          status: student.status === 'active' ? 'inactive' : 'active',
          planStatus: student.status === 'active' ? 'expired' : 'active',
          lastModified: serverTimestamp(),
          lastModifiedBy: auth.currentUser.email,
        },
        { merge: true }
      );

      // Atualizar estado local
      setStudents(students.map(s => 
        s.id === student.id 
          ? { 
              ...s, 
              status: s.status === 'active' ? 'inactive' : 'active',
              planStatus: s.status === 'active' ? 'expired' : 'active'
            } 
          : s
      ));

      toast({
        title: `Aluno ${student.status === 'active' ? 'desativado' : 'reativado'} com sucesso!`,
        description: student.status === 'active' 
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
      const db = getFirestore();

      // 1. Criar usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newStudent.email,
        newStudent.password
      );

      // 2. Adicionar informações do usuário no Firestore
      const userDoc = {
        uid: userCredential.user.uid,
        name: newStudent.name,
        email: newStudent.email,
        role: "student",
        createdAt: serverTimestamp(),
        status: "active",
        planStatus: "active",
        lastLogin: null,
        plan: newStudent.plan,
        planStartDate: serverTimestamp(),
        planEndDate: calculatePlanEndDate(newStudent.plan),
      };

      // Usar o mesmo ID do Authentication como ID do documento no Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), userDoc);

      toast({
        title: "Aluno adicionado com sucesso!",
        description: "O aluno já pode acessar a plataforma.",
      });

      setIsAddDialogOpen(false);
      setNewStudent({ name: "", email: "", password: "", plan: "mensal" });
      fetchStudents();
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
                className={student.status === 'inactive' ? 'bg-gray-50' : ''}
              >
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.plan || "N/A"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      student.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {student.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  {student.planEndDate
                    ? new Date(student.planEndDate.seconds * 1000).toLocaleDateString()
                    : student.plan === "vitalicio"
                    ? "Nunca"
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {student.lastLogin
                    ? new Date(student.lastLogin.seconds * 1000).toLocaleDateString()
                    : "Nunca acessou"}
                </TableCell>
                <TableCell>
                  <Button
                    variant={student.status === "active" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleDeactivateStudent(student)}
                    className={student.status === "active" ? "" : "text-green-600 border-green-600 hover:bg-green-50"}
                  >
                    {student.status === "active" ? "Desativar" : "Reativar"}
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
