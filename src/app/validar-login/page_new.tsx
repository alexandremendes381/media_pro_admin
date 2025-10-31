"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CheckCircle, XCircle, Clock, Search, AlertTriangle, Shield, Eye, EyeOff, MapPin, Smartphone, Activity } from "lucide-react";
import { loginValidationAPI, apiUtils } from "@/lib/api";
import { LoginAttempt } from "@/types/api";
import { useAuthContext } from "@/contexts/AuthContext";

function StatusBadge({ status }: { status: LoginAttempt['status'] }) {
  const variants = {
    pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600", label: "Pendente" },
    approved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600", label: "Aprovado" },
    rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600", label: "Rejeitado" },
  };

  const config = variants[status] || variants.pending;
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}

function RiskBadge({ riskScore, isSuspicious }: { riskScore: number; isSuspicious: boolean }) {
  const riskLevel = apiUtils.getRiskLevel(riskScore);
  
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={riskLevel.level === 'low' ? 'default' : 'destructive'}
        className={`
          ${riskLevel.level === 'low' ? 'bg-green-100 text-green-800' : ''}
          ${riskLevel.level === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${riskLevel.level === 'high' ? 'bg-orange-100 text-orange-800' : ''}
          ${riskLevel.level === 'critical' ? 'bg-red-100 text-red-800' : ''}
        `}
      >
        <Shield className="h-3 w-3 mr-1" />
        Risco: {riskLevel.label} ({riskScore})
      </Badge>
      {isSuspicious && (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Suspeito
        </Badge>
      )}
    </div>
  );
}

export default function ValidarLoginPage() {
  const { isAuthenticated } = useAuthContext();
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  
  const queryClient = useQueryClient();

  // Query para buscar tentativas de login
  const { data: attemptsResponse, isLoading: attemptsLoading, refetch: refetchAttempts, error: attemptsError } = useQuery({
    queryKey: ['login-attempts', statusFilter],
    queryFn: () => loginValidationAPI.getLoginAttempts({
      status: statusFilter,
      limit: 50,
    }),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Mutation para validar tentativa de login
  const validateMutation = useMutation({
    mutationFn: ({ attemptId, action, notes }: { 
      attemptId: string; 
      action: 'approve' | 'reject'; 
      notes?: string;
    }) => {
      return loginValidationAPI.validateLoginAttempt(attemptId, action, notes);
    },
    onSuccess: (response) => {
      // Invalidar e refazer as queries após validação bem-sucedida
      queryClient.invalidateQueries({ queryKey: ['login-attempts'] });
      
      // Mostrar mensagem de sucesso se disponível
      if (response.data?.message) {
        console.log(response.data.message);
      }
    },
    onError: (error) => {
      console.error('Erro ao validar tentativa de login:', error);
    },
  });

  const handleValidateLogin = (attemptId: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'aprovar' : 'rejeitar';
    if (!window.confirm(`Tem certeza que deseja ${actionText} esta tentativa de login?`)) {
      return;
    }

    validateMutation.mutate({ attemptId, action });
  };

  // Verificar autenticação
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-muted-foreground text-center">
              Você precisa estar logado para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (attemptsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando tentativas de login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (attemptsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Dados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Não foi possível carregar as tentativas de login.
            </p>
            <Button onClick={() => refetchAttempts()} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loginAttempts = attemptsResponse?.data?.attempts || [];
  const total = attemptsResponse?.data?.total || 0;

  // Calcular estatísticas localmente
  const stats = {
    pending: loginAttempts.filter(attempt => attempt.status === 'pending').length,
    approved: loginAttempts.filter(attempt => attempt.status === 'approved').length,
    rejected: loginAttempts.filter(attempt => attempt.status === 'rejected').length,
    suspicious: loginAttempts.filter(attempt => attempt.is_suspicious).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validar Tentativas de Login</h1>
          <p className="text-muted-foreground">
            Gerencie e valide tentativas de login suspeitas
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)} 
            variant="outline"
            size="sm"
          >
            {showSensitiveInfo ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitiveInfo ? 'Ocultar' : 'Mostrar'} Info Sensível
          </Button>
          <Button onClick={() => refetchAttempts()} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
        <div className="text-sm text-muted-foreground">
          Total: {total} tentativas
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspeitos</p>
                <p className="text-2xl font-bold text-orange-600">{stats.suspicious}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tentativas de Login */}
      <div className="space-y-4">
        {loginAttempts.map((attempt) => (
          <Card key={attempt.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {attempt.full_name || attempt.username || 'Usuário Desconhecido'}
                    <span className="text-sm text-muted-foreground font-normal">
                      {attempt.email}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Tentativa em {apiUtils.formatDate(attempt.login_time)} • 
                    IP: {showSensitiveInfo ? attempt.ip_address : apiUtils.formatIP(attempt.ip_address)}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={attempt.status} />
                  <RiskBadge riskScore={attempt.risk_score} isSuspicious={attempt.is_suspicious} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Tentativas:</span>
                      <p className="text-muted-foreground">{attempt.attempts_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Localização:</span>
                      <p className="text-muted-foreground">{attempt.location || 'Não disponível'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Dispositivo:</span>
                      <p className="text-muted-foreground">{attempt.device_info || 'Não disponível'}</p>
                    </div>
                  </div>
                </div>

                {selectedAttempt === attempt.id && (
                  <div className="pt-4 border-t">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium">User Agent:</span>
                        <p className="text-muted-foreground text-sm break-all">{attempt.user_agent}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ID da Tentativa:</span>
                          <p className="text-muted-foreground font-mono">{attempt.id}</p>
                        </div>
                        <div>
                          <span className="font-medium">ID do Usuário:</span>
                          <p className="text-muted-foreground font-mono">{attempt.user_id}</p>
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span>
                          <p className="text-muted-foreground">{apiUtils.formatDate(attempt.created_at)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Atualizado em:</span>
                          <p className="text-muted-foreground">{apiUtils.formatDate(attempt.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {attempt.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleValidateLogin(attempt.id, 'approve')}
                        disabled={validateMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleValidateLogin(attempt.id, 'reject')}
                        disabled={validateMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedAttempt(selectedAttempt === attempt.id ? null : attempt.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {selectedAttempt === attempt.id ? 'Ocultar' : 'Ver'} Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loginAttempts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tentativa encontrada</h3>
            <p className="text-muted-foreground text-center">
              Não há tentativas de login {statusFilter !== 'all' ? `${statusFilter}` : ''} no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}