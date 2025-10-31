"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Gavel, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

// Dados mockados para o dashboard
const mockDashboardData = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    loginsPendentes: 2,
    leiloesPendentes: 2,
    loginsTotais: 15,
    leiloesTotais: 8,
    alertas: 3,
  };
};

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, admin } = useAuthContext();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: mockDashboardData,
    enabled: isAuthenticated, // Só buscar dados se autenticado
  });

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Se não autenticado, não mostrar nada (redirecionamento está acontecendo)
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {admin?.nome || 'Administrador'}!
        </h1>
        <p className="text-muted-foreground">
          Visão geral das validações pendentes e estatísticas do painel administrativo
        </p>
      </div>

      {/* Alertas */}
      {stats?.alertas && stats.alertas > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {stats.alertas} item{stats.alertas > 1 ? 's' : ''} requer{stats.alertas === 1 ? '' : 'em'} atenção
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Verifique as validações pendentes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logins Pendentes
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loginsPendentes || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.loginsTotais || 0} tentativas totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leilões Pendentes
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.leiloesPendentes || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.leiloesTotais || 0} leilões totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              para validação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atividades recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Validações Recentes - Login</CardTitle>
            <CardDescription>
              Últimas tentativas de login processadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">admin@mediapro.com</p>
                <p className="text-xs text-muted-foreground">há 30 minutos</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">user@mediapro.com</p>
                <p className="text-xs text-muted-foreground">há 1 hora</p>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aprovado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">editor@mediapro.com</p>
                <p className="text-xs text-muted-foreground">há 2 horas</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leilões em Análise</CardTitle>
            <CardDescription>
              Leilões aguardando aprovação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Equipamentos Audiovisuais</p>
                <p className="text-xs text-muted-foreground">MediaPro Studios</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Arte Digital NFT</p>
                <p className="text-xs text-muted-foreground">Digital Arts Collective</p>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aprovado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Instrumentos Vintage</p>
                <p className="text-xs text-muted-foreground">Music Heritage Collection</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}