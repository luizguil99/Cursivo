// Importações de bibliotecas React e roteamento
import React from "react";
import { useNavigate } from "react-router-dom";
// Importações para gerenciamento de formulário e validação
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Importações de componentes da interface do usuário
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
// Importações de autenticação e recursos
import { useAuth } from "@/contexts/AuthContext";
import logo from "/Imagens/Logo.png";

// Esquema de validação do formulário usando Zod
const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
});

function App() {
  // Estados para controle da interface
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Hooks para navegação e autenticação
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Configuração do formulário com validação
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Função para lidar com o envio do formulário
  async function onSubmit(values) {
    try {
      setError("");
      setLoading(true);
      await login(values.email, values.password);
      navigate("/courses");
    } catch (err) {
      setError("Falha ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  // Função para lidar com login via Google
  async function handleGoogleLogin() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      navigate("/courses");
    } catch (err) {
      setError("Falha ao fazer login com Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toaster />
      <main className="min-h-screen flex">
        {/* Seção do formulário de login */}
        <section className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background">
          <div className="w-full max-w-sm">
            {/* Logo do Cursivo */}
            <img src={logo} alt="Logo" className="h-20 w-auto mb-8 -ml-3" />

            <div className="space-y-6">
              {/* Exibição de mensagens de erro */}
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {/* Formulário de login */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Campo de email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu@email.com"
                            type="email"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Campo de senha com toggle de visibilidade */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Digite sua senha"
                              type={showPassword ? "text" : "password"}
                              {...field}
                              disabled={loading}
                            />
                            {/* Botão para mostrar/ocultar senha */}
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Botão de submit com gradiente */}
                  <button
                    type="submit"
                    className="w-full h-10 rounded-md text-white font-medium disabled:opacity-50"
                    style={{
                      background:
                        "linear-gradient(90deg, #B4902A -158.27%, #F3C92C 108.81%)",
                    }}
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              </Form>

              {/* Separador "ou continue com" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              {/* Botão de login com Google */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {/* Ícone do Google */}
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button>
            </div>
          </div>
        </section>

        {/* Seção de background decorativo */}
        <section
          className="hidden lg:block lg:w-1/2 min-h-screen"
          style={{
            background:
              "linear-gradient(192deg, #73ED7F -43.18%, #FEC625 91.3%)",
          }}
        >
          {/* Efeito de gradiente radial */}
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_100%)]" />
        </section>
      </main>
    </>
  );
}

export default App;
