"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  User,
  RefreshCw,
  CheckCircle
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import type { CreateAuctionRequest } from "@/types/api";

export default function CreateAuctionsPage() {
  const queryClient = useQueryClient();
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  // Mutation para criar leilões de teste
  const createTestAuctionsMutation = useMutation({
    mutationFn: api.utils.createTestAuctions,
    onMutate: () => {
      setIsCreatingTest(true);
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      setIsCreatingTest(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar leilões: ${error.message}`);
      setIsCreatingTest(false);
    }
  });

  const handleCreateTestAuctions = () => {
    const confirmed = window.confirm(
      "Criar 4 leilões de teste?\n\n" +
      "Leilões serão criados para iniciar entre 5 e 15 minutos a partir de agora:\n" +
      "• Ensaio Artístico em Estúdio (inicia em 5 min)\n" +
      "• Sessão Golden Hour (inicia em 8 min)\n" +
      "• Ensaio Pin-up Vintage (inicia em 12 min)\n" +
      "• Book Profissional Alta Costura (inicia em 15 min)\n\n" +
      "Confirma a criação?"
    );

    if (confirmed) {
      createTestAuctionsMutation.mutate();
    }
  };

  const formatTime = (minutes: number) => {
    const now = new Date();
    const startTime = new Date(now.getTime() + minutes * 60 * 1000);
    return startTime.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Leilões</h1>
          <p className="text-muted-foreground">
            Ferramentas para criação e gerenciamento de leilões de teste
          </p>
        </div>
      </div>

      {/* Card para criar leilões de teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Leilões de Teste
          </CardTitle>
          <CardDescription>
            Crie 4 leilões de demonstração com horários escalonados entre 5 e 15 minutos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview dos leilões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Leilões que serão criados:
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Ensaio Artístico em Estúdio</p>
                    <p className="text-muted-foreground">Conceito minimalista</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-medium">R$ 250,00</p>
                    <p className="text-xs text-muted-foreground">{formatTime(5)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sessão Golden Hour</p>
                    <p className="text-muted-foreground">Parque da Cidade</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-medium">R$ 350,00</p>
                    <p className="text-xs text-muted-foreground">{formatTime(8)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Ensaio Pin-up Vintage</p>
                    <p className="text-muted-foreground">Década de 50</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-medium">R$ 450,00</p>
                    <p className="text-xs text-muted-foreground">{formatTime(12)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Book Profissional</p>
                    <p className="text-muted-foreground">Alta Costura</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-medium">R$ 600,00</p>
                    <p className="text-xs text-muted-foreground">{formatTime(15)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Informações dos Leilões:
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Creators: IDs 1, 2, 3 e 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Duração: 24h a 72h cada</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Lance mínimo: R$ 50 a R$ 150</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Status inicial: Em análise</span>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Nota:</strong> Os leilões serão criados com horários escalonados 
                  para que você possa testar diferentes cenários de início e duração.
                </p>
              </div>
            </div>
          </div>

          {/* Botão de ação */}
          <div className="flex justify-center pt-4 border-t">
            <Button
              onClick={handleCreateTestAuctions}
              disabled={isCreatingTest}
              size="lg"
              className="w-full max-w-md"
            >
              {isCreatingTest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando leilões...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Criar 4 Leilões de Teste
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Via Interface (esta página):</h4>
              <p className="text-muted-foreground">
                Use o botão acima para criar os leilões através da interface do admin.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Via Terminal:</h4>
              <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                npm run create-test-auctions
              </div>
              <p className="text-muted-foreground mt-2">
                Execute este comando no terminal para criar os leilões via script.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Após a criação:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Os leilões aparecerão na página de validação de leilões</li>
                <li>Você pode aprovar ou rejeitar cada leilão</li>
                <li>Leilões aprovados ficarão visíveis para usuários</li>
                <li>Use a página &quot;Transferir MediaCoins&quot; para gerenciar leilões expirados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}