import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/contexts/AccessContext';
import { useAuth } from '@/contexts/AuthContext';
import { LockKeyhole, Mail, RefreshCw } from 'lucide-react';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { userData } = useAccess();
  const { currentUser } = useAuth();

  const handleContactSupport = () => {
    window.location.href = `mailto:suporte@cursivo.com?subject=Reativação de Conta&body=Olá, gostaria de reativar minha conta.%0D%0A%0D%0AEmail: ${currentUser?.email}`;
  };

  const handleRenewSubscription = () => {
    // Aqui você pode adicionar a lógica para renovação da assinatura
    // Por exemplo, redirecionar para uma página de pagamento
    navigate('/renew-subscription');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-destructive/10 p-3 rounded-full">
              <LockKeyhole className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Acesso Negado</h1>
            <p className="text-muted-foreground">
              {userData?.status === 'inactive' 
                ? 'Sua conta está atualmente inativa.'
                : 'Seu plano expirou ou está inativo.'}
            </p>
          </div>

          <div className="space-y-4">
            {userData?.status === 'inactive' ? (
              <Button 
                className="w-full" 
                onClick={handleContactSupport}
                variant="default"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contatar Suporte
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleRenewSubscription}
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Renovar Assinatura
              </Button>
            )}

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/')}
            >
              Voltar para Início
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Precisa de ajuda? Entre em contato com nosso suporte em{' '}
            <a 
              href="mailto:suporte@cursivo.com" 
              className="text-primary hover:underline"
            >
              suporte@cursivo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
