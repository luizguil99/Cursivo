import { useAccess } from "@/contexts/AccessContext";
import { Button } from "@/components/ui/button";

export default function PlanExpired() {
  const { planDetails } = useAccess();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Seu plano expirou
          </h2>
          
          {planDetails ? (
            <div className="mb-6 text-gray-600">
              <p className="mb-2">
                Plano atual: <span className="font-semibold">{planDetails.plan}</span>
              </p>
              {planDetails.endDate && (
                <p className="mb-2">
                  Expirou em:{" "}
                  <span className="font-semibold">
                    {planDetails.endDate.toLocaleDateString()}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="mb-6 text-gray-600">
              Você precisa de um plano ativo para acessar o conteúdo.
            </p>
          )}

          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={() => {
                // Aqui você pode redirecionar para a página de renovação
                // ou abrir um modal de pagamento
                console.log("Renovar plano");
              }}
            >
              Renovar Plano
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Redirecionar para a página de planos
                console.log("Ver planos disponíveis");
              }}
            >
              Ver Planos Disponíveis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
