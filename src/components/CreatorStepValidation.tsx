"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  AlertTriangle, 
  User, 
  Loader2
} from "lucide-react";
import StepValidation from "@/components/StepValidation";
import { userValidationAPI } from "@/lib/api";
import { PendingUser, CreatorStepsResponse } from "@/types/api";

interface CreatorStepValidationProps {
  user: PendingUser;
  onBack: () => void;
}

function StatusBadge({ status }: { status: 'em_analise' | 'aprovado' | 'rejeitado' }) {
  const variants = {
    em_analise: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600", label: "Em Análise" },
    aprovado: { variant: "default" as const, icon: CheckCircle, color: "text-green-600", label: "Aprovado" },
    rejeitado: { variant: "destructive" as const, icon: XCircle, color: "text-red-600", label: "Rejeitado" },
  };

  const config = variants[status] || variants.em_analise;
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}

const CreatorStepValidation: React.FC<CreatorStepValidationProps> = ({ user, onBack }) => {
  const queryClient = useQueryClient();

  // Query para buscar detalhes dos passos
  const { data: stepsData, isLoading: stepsLoading, error: stepsError, refetch: refetchSteps } = useQuery({
    queryKey: ['creator-steps', user.request_id],
    queryFn: () => {
      if (!user.request_id) {
        throw new Error('Request ID não encontrado');
      }
      return userValidationAPI.getCreatorSteps(user.request_id);
    },
    enabled: !!user.request_id,
  });

  // Mutation para validar passo específico
  const validateStepMutation = useMutation({
    mutationFn: ({ 
      stepNumber, 
      approved, 
      observations, 
      rejectionReason 
    }: { 
      stepNumber: number; 
      approved: boolean; 
      observations?: string;
      rejectionReason?: string;
    }) => {
      if (!user.request_id) {
        throw new Error('Request ID não encontrado');
      }
      
      return userValidationAPI.validateCreatorStep(user.request_id, stepNumber, {
        aprovado: approved,
        observacoes: observations,
        motivo_rejeicao: rejectionReason,
      });
    },
    onSuccess: (response) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['creator-steps'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      alert(`✅ ${response.message}`);
      refetchSteps();
    },
    onError: (error: any) => {
      console.error('Erro ao validar passo:', error);
      alert(`❌ Erro ao validar passo: ${error.message}`);
    },
  });

  const handleValidateStep = (stepNumber: number, approved: boolean, observations?: string, rejectionReason?: string) => {
    if (!approved && !rejectionReason?.trim()) {
      alert('Por favor, informe o motivo da reprovação.');
      return;
    }

    validateStepMutation.mutate({ stepNumber, approved, observations, rejectionReason });
  };

  if (stepsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando detalhes dos passos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stepsError || !stepsData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Passos</h3>
            <p className="text-muted-foreground text-center mb-4">
              Não foi possível carregar os detalhes dos passos de validação.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => refetchSteps()} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={onBack} variant="secondary">
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Validação por Passos</h1>
            <p className="text-muted-foreground">
              Valide cada etapa do processo de upgrade para creator
            </p>
          </div>
        </div>
      </div>

      {/* Resumo do Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl">
                  {user.nome_completo || user.user_nome || user.user_nickname || `Usuário ${user.id}`}
                </h2>
                <p className="text-muted-foreground">
                  {user.user_email || user.email} • Request ID: {user.request_id}
                </p>
              </div>
            </div>
            <StatusBadge status={stepsData.status_geral} />
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Barra de Progresso */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso Geral</span>
                <span>{stepsData.progresso_percentage}%</span>
              </div>
              <Progress value={stepsData.progresso_percentage} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">
                {stepsData.passos_completos} de {stepsData.total_passos} passos completos
              </p>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Criado em:</span>
                <p className="text-muted-foreground">
                  {new Date(stepsData.timestamps.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span>
                <p className="text-muted-foreground">
                  {new Date(stepsData.timestamps.updated_at).toLocaleString()}
                </p>
              </div>
              {stepsData.timestamps.approved_at && (
                <div>
                  <span className="font-medium">Aprovado em:</span>
                  <p className="text-muted-foreground">
                    {new Date(stepsData.timestamps.approved_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {stepsData.status_geral === 'rejeitado' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta solicitação foi rejeitada. O creator precisa corrigir os itens reprovados e reenviar.
          </AlertDescription>
        </Alert>
      )}

      {stepsData.status_geral === 'aprovado' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Solicitação aprovada! O creator já pode usar a plataforma.
          </AlertDescription>
        </Alert>
      )}

      {/* Passos de Validação */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Passos de Validação</h2>
        
        {stepsData.passos.map((step) => (
          <StepValidation
            key={step.step}
            step={step}
            requestId={stepsData.request_id}
            onValidate={handleValidateStep}
            isLoading={validateStepMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
};

export default CreatorStepValidation;