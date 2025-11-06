"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  User, 
  Shield,
  Phone,
  MapPin,
  Mail,
  Calendar
} from "lucide-react";
import creatorsManagementAPI from "@/lib/creators-api";
import { Creator } from "@/types/api";
import { toast } from "sonner";

// Hook para buscar creators
const useCreators = (statusFilter?: 'em_analise' | 'aprovado' | 'reprovado') => {
  return useQuery({
    queryKey: ['creators', statusFilter],
    queryFn: () => {
      // Chamar API real de creators
      return creatorsManagementAPI.creators.getAllCreators(
        statusFilter ? { status_filter: statusFilter } : undefined
      );
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};

// Função para mapear status para badge
const getStatusBadge = (status: string) => {
  const statusMap = {
    em_analise: { variant: "secondary" as const, color: "text-blue-600", icon: Eye, label: "Em Análise" },
    aprovado: { variant: "default" as const, color: "text-green-600", icon: CheckCircle, label: "Aprovado" },
    reprovado: { variant: "destructive" as const, color: "text-red-600", icon: XCircle, label: "Reprovado" }
  };
  
  return statusMap[status as keyof typeof statusMap] || statusMap.em_analise;
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

function CreatorDetailView({ creator }: { creator: Creator }) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border space-y-4">
      <h4 className="font-semibold">Detalhes do Creator</h4>
      
      {/* Informações Pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-2">Informações Pessoais</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Nome:</span> {creator.nome_completo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Nome Artístico:</span> {creator.nome_artistico}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Email:</span> {creator.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Telefone:</span> {creator.telefone}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium mb-2">Localização e Status</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Local:</span> {creator.cidade}, {creator.estado}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span><span className="font-medium">Cadastrado em:</span> {formatDate(creator.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Conta Ativa:</span>
              {creator.is_active ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Verificado:</span>
              {creator.is_verified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documentos */}
      {(creator.documento_frente || creator.documento_verso || creator.selfie_documento) && (
        <div>
          <h5 className="font-medium mb-2">Documentos</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creator.documento_frente && (
              <div>
                <p className="text-xs font-medium mb-1">Documento Frente</p>
                <div className="relative w-full h-32 rounded border overflow-hidden">
                  <Image 
                    src={creator.documento_frente} 
                    alt="Documento Frente" 
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {creator.documento_verso && (
              <div>
                <p className="text-xs font-medium mb-1">Documento Verso</p>
                <div className="relative w-full h-32 rounded border overflow-hidden">
                  <Image 
                    src={creator.documento_verso} 
                    alt="Documento Verso" 
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {creator.selfie_documento && (
              <div>
                <p className="text-xs font-medium mb-1">Selfie com Documento</p>
                <div className="relative w-full h-32 rounded border overflow-hidden">
                  <Image 
                    src={creator.selfie_documento} 
                    alt="Selfie Documento" 
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      {creator.status_da_conta === 'em_analise' && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => handleApproveCreator(creator.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Creator
          </Button>
          <Button
            onClick={() => handleRejectCreator(creator.id)}
            variant="destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reprovar Creator
          </Button>
        </div>
      )}
    </div>
  );
}

// Função para lidar com aprovação (será implementada)
function handleApproveCreator(creatorId: number) {
  creatorsManagementAPI.creators.updateCreatorStatus(creatorId, { status: 'aprovado' })
    .then(() => {
      toast.success(`Creator ${creatorId} aprovado com sucesso!`);
    })
    .catch(() => {
      toast.error(`Erro ao aprovar creator ${creatorId}`);
    });
}

// Função para lidar com reprovação (será implementada) 
function handleRejectCreator(creatorId: number) {
  creatorsManagementAPI.creators.updateCreatorStatus(creatorId, { status: 'reprovado' })
    .then(() => {
      toast.success(`Creator ${creatorId} reprovado.`);
    })
    .catch(() => {
      toast.error(`Erro ao reprovar creator ${creatorId}`);
    });
}

export default function ValidarCreatorsPage() {
  const [selectedCreator, setSelectedCreator] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'em_analise' | 'aprovado' | 'reprovado' | 'all'>('all');
  const queryClient = useQueryClient();

  // Busca creators
  const { data: creators, isLoading, refetch } = useCreators(
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
            <p>Carregando creators...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredCreators = creators?.filter(creator => {
    if (statusFilter === 'all') return true;
    return creator.status_da_conta === statusFilter;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Creators</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os creators da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">Todos os Status</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
          </select>
          <Button onClick={() => refetch()} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {creator.nome_completo}
                  </CardTitle>
                  <CardDescription className="text-base">
                    @{creator.nome_artistico} • {creator.email}
                  </CardDescription>
                </div>
                <StatusBadge status={creator.status_da_conta} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium">Localização</p>
                    <p className="text-sm text-muted-foreground">{creator.cidade}, {creator.estado}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Status da Conta</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Ativo:</span>
                      {creator.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-muted-foreground">| Verificado:</span>
                      {creator.is_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Cadastrado em</p>
                    <p className="text-sm text-muted-foreground">{formatDate(creator.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCreator(selectedCreator === creator.id ? null : creator.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedCreator === creator.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                  </Button>
                  
                  {creator.status_da_conta === 'em_analise' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleApproveCreator(creator.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleRejectCreator(creator.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reprovar
                      </Button>
                    </>
                  )}
                </div>

                {selectedCreator === creator.id && (
                  <CreatorDetailView creator={creator} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredCreators.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Nenhum creator encontrado com o filtro atual.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}