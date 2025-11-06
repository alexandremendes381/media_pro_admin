"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  User, 
  UserPlus,
  FileText,
  Image,
  CreditCard,
  Shield,
  Mail,
  AlertTriangle
} from "lucide-react";
import creatorsManagementAPI from "@/lib/creators-api";
import { CreatorUpgradeRequest, CreatorUpgradeRequestDetails } from "@/types/api";

// Função utilitária para formatar datas
const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Hook para buscar solicitações de upgrade
const useUpgradeRequests = (statusFilter?: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado') => {
  return useQuery({
    queryKey: ['upgrade-requests', statusFilter],
    queryFn: () => {
      // Chamar API real de upgrade requests
      return creatorsManagementAPI.upgradeRequests.getAllCreatorUpgradeRequests(
        statusFilter ? { status_filter: statusFilter } : undefined
      );
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};

// Função para mapear stage para ícone
const getStageIcon = (stageNumber: number) => {
  const iconMap = {
    1: User,
    2: UserPlus,
    3: Image,
    4: CreditCard,
    5: Shield,
    6: Mail,
  };
  return iconMap[stageNumber as keyof typeof iconMap] || FileText;
};

// Função para obter cor do progresso
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return "bg-green-500";
  if (percentage >= 75) return "bg-blue-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-gray-400";
};

// Função para mapear status para badge
const getStatusBadge = (status: string) => {
  const statusMap = {
    pendente: { variant: "outline" as const, color: "text-yellow-600", icon: Clock, label: "Pendente" },
    em_analise: { variant: "secondary" as const, color: "text-blue-600", icon: Eye, label: "Em Análise" },
    aprovado: { variant: "default" as const, color: "text-green-600", icon: CheckCircle, label: "Aprovado" },
    rejeitado: { variant: "destructive" as const, color: "text-red-600", icon: XCircle, label: "Rejeitado" },
    cancelado: { variant: "secondary" as const, color: "text-gray-600", icon: AlertTriangle, label: "Cancelado" }
  };
  
  return statusMap[status as keyof typeof statusMap] || statusMap.pendente;
};

function StatusBadge({ status }: { status: string }) {
  const config = getStatusBadge(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}

function StageProgress({ upgrade }: { upgrade: CreatorUpgradeRequest }) {
  const progressPercentage = upgrade.progresso_percentage;
  
  return (
    <div className="space-y-3">
      <h5 className="text-sm font-medium">Progresso dos Stages</h5>
      <div className="flex items-center gap-2 mb-2">
        <Progress value={progressPercentage} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground">{upgrade.stages_concluidos}/6 completos</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const stageNumber = i + 1;
          const isCompleted = stageNumber <= upgrade.stages_concluidos;
          const Icon = getStageIcon(stageNumber);
          const stageNames = [
            "Dados Pessoais",
            "Perfil Criador", 
            "Capa e Biografia",
            "Planos de Assinatura",
            "Verificação de Identidade",
            "Verificação de Email"
          ];
          
          return (
            <div
              key={stageNumber}
              className={`flex items-center gap-2 p-2 rounded text-xs ${
                isCompleted
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              <Icon className="h-3 w-3 flex-shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-medium">{stageNames[i]}</div>
                {isCompleted && (
                  <CheckCircle className="h-3 w-3 text-green-600 inline" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpgradeDetailView({ upgrade }: { upgrade: CreatorUpgradeRequest }) {
  // ...existing code...

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border space-y-4">
      <h4 className="font-semibold">Detalhes da Solicitação de Upgrade</h4>
      
      {/* Progresso Geral */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progresso Geral</span>
          <span className="text-sm text-muted-foreground">{upgrade.progresso_percentage}%</span>
        </div>
        <Progress value={upgrade.progresso_percentage} className="h-2" />
      </div>

      {/* Informações do Usuário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-2">Informações Pessoais</h5>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Nome Completo:</span> {upgrade.nome_completo}</div>
            <div><span className="font-medium">CPF:</span> {upgrade.cpf}</div>
            <div><span className="font-medium">Data de Nascimento:</span> {new Date(upgrade.data_nascimento).toLocaleDateString('pt-BR')}</div>
            <div><span className="font-medium">País:</span> {upgrade.pais}</div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium mb-2">Perfil Creator</h5>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Nickname:</span> {upgrade.nickname}</div>
            <div><span className="font-medium">Categoria:</span> {upgrade.categoria}</div>
            <div><span className="font-medium">Email:</span> {upgrade.email_verificacao}</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email Verificado:</span>
              {upgrade.email_verificado ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status dos Recursos */}
      <div>
        <h5 className="font-medium mb-2">Status dos Recursos</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Perfil:</span>
            {upgrade.perfil_configurado ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Capa:</span>
            {upgrade.capa_configurada ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Planos:</span>
            {upgrade.planos_configurados ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Documentos:</span>
            {upgrade.documentos_enviados ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Progresso dos Stages */}
      <StageProgress upgrade={upgrade} />

      {/* Informações de Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <span className="font-medium">Solicitação criada:</span>
          <p className="text-muted-foreground">{formatDate(upgrade.created_at)}</p>
        </div>
        <div>
          <span className="font-medium">Última atualização:</span>
          <p className="text-muted-foreground">{formatDate(upgrade.updated_at)}</p>
        </div>
        {upgrade.approved_at && (
          <div>
            <span className="font-medium">Aprovado em:</span>
            <p className="text-green-600">{formatDate(upgrade.approved_at)}</p>
          </div>
        )}
        {upgrade.motivo_rejeicao && (
          <div>
            <span className="font-medium">Motivo da Rejeição:</span>
            <p className="text-red-600 bg-red-50 p-2 rounded border">{upgrade.motivo_rejeicao}</p>
          </div>
        )}
      </div>

      {/* Ações de Aprovação */}
      {upgrade.status === 'pendente' && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => handleApproveUpgrade(upgrade.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Solicitação
          </Button>
          <Button
            onClick={() => handleRejectUpgrade(upgrade.id)}
            variant="destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar Solicitação
          </Button>
        </div>
      )}
    </div>
  );
}

// Função para lidar com aprovação (será implementada)
function handleApproveUpgrade(requestId: number) {
  creatorsManagementAPI.upgradeRequests.updateUpgradeRequestStatus(requestId, { status: 'aprovado' })
    .then(() => {
      toast.success(`Solicitação ${requestId} aprovada com sucesso!`);
    })
    .catch(() => {
      toast.error(`Erro ao aprovar solicitação ${requestId}`);
    });
}

// Função para lidar com rejeição (será implementada) 
function handleRejectUpgrade(requestId: number) {
  creatorsManagementAPI.upgradeRequests.updateUpgradeRequestStatus(requestId, { status: 'rejeitado' })
    .then(() => {
      toast.success(`Solicitação ${requestId} rejeitada.`);
    })
    .catch(() => {
      toast.error(`Erro ao rejeitar solicitação ${requestId}`);
    });
}

export default function ValidarUpgradePage() {
  const [selectedUpgrade, setSelectedUpgrade] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'all'>('all');
  const queryClient = useQueryClient();

  // Busca solicitações de upgrade
  const { data: upgradeRequests, isLoading, refetch } = useUpgradeRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando solicitações de upgrade...</p>
          </div>
        </div>
      </div>
    );
  }

  const upgrades = upgradeRequests || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validar Upgrade</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso dos usuários através dos 6 stages do sistema de upgrade
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
          <Button onClick={() => refetch()} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {upgrades.map((upgrade) => (
          <Card key={upgrade.id} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {upgrade.nome_completo}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {upgrade.nickname} • {upgrade.email_verificacao}
                  </CardDescription>
                </div>
                <StatusBadge status={upgrade.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso: {upgrade.stages_concluidos}/6 stages</span>
                  <span className="text-sm text-muted-foreground">{upgrade.progresso_percentage}%</span>
                </div>
                
                <Progress 
                  value={upgrade.progresso_percentage} 
                  className={`h-3 ${getProgressColor(upgrade.progresso_percentage)}`} 
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium">Categoria</p>
                    <p className="text-sm text-muted-foreground">{upgrade.categoria}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Stages Concluídos</p>
                    <p className="text-sm text-muted-foreground">
                      {upgrade.stages_concluidos} de 6
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Última Atualização</p>
                    <p className="text-sm text-muted-foreground">{formatDate(upgrade.updated_at)}</p>
                  </div>
                </div>

                <StageProgress upgrade={upgrade} />

                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedUpgrade(selectedUpgrade === upgrade.id ? null : upgrade.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalhes Completos
                  </Button>
                </div>

                {selectedUpgrade === upgrade.id && (
                  <UpgradeDetailView upgrade={upgrade} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {upgrades.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum upgrade encontrado</h3>
            <p className="text-muted-foreground text-center">
              Não há solicitações de upgrade para o filtro selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}