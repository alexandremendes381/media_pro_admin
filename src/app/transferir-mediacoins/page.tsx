"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Trophy, 
  User, 
  Calendar, 
  Coins,
  CheckCircle,
  AlertTriangle,
  Eye,
  FileText,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import api from "@/lib/api";
import { ExpiredAuction, FinalizeAuctionRequest } from "@/types/api";
import { toast } from "sonner";

export default function TransferirMediacoinsPage() {
  const [selectedAuction, setSelectedAuction] = useState<number | null>(null);
  const [processingAuctions, setProcessingAuctions] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Busca leilões expirados
  const { 
    data: expiredAuctions, 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['expired-auctions'],
    queryFn: () => api.auctions.getExpiredAuctions({ page: 1, per_page: 50 }),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Mutation para finalizar leilão
  const finalizeMutation = useMutation({
    mutationFn: ({ auctionId, request }: { 
      auctionId: number; 
      request?: FinalizeAuctionRequest 
    }) => api.auctions.finalizeAuctionManually(auctionId, request),
    onMutate: ({ auctionId }) => {
      setProcessingAuctions(prev => new Set([...prev, auctionId]));
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Leilão "${data.titulo}" finalizado com sucesso! ` +
        `${data.mediacoins_transferidos} MediaCoins transferidos.`
      );
      queryClient.invalidateQueries({ queryKey: ['expired-auctions'] });
      setProcessingAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.auctionId);
        return newSet;
      });
    },
    onError: (error, variables) => {
      toast.error(`Erro ao finalizar leilão: ${error.message}`);
      setProcessingAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.auctionId);
        return newSet;
      });
    },
  });

  const handleFinalizeAuction = async (auction: ExpiredAuction) => {
    const confirmed = window.confirm(
      `Confirma a finalização do leilão "${auction.titulo}"?\n\n` +
      `Ações que serão executadas:\n` +
      `• Transferir MediaCoins para o vencedor\n` +
      `• Liberar mídia para o vencedor\n` +
      `• Alterar status para "finalizado"\n\n` +
      `Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      finalizeMutation.mutate({
        auctionId: auction.auction_id,
        request: {
          observacoes: `Finalização manual - Admin: ${new Date().toLocaleString()}`
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando leilões expirados...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro ao carregar leilões expirados: {error.message}</span>
            </div>
            <Button 
              onClick={() => refetch()} 
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transferir MediaCoins</h1>
          <p className="text-muted-foreground">
            Finalize leilões expirados e transfira MediaCoins para os vencedores
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {expiredAuctions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Expirados</p>
                  <p className="text-2xl font-bold">{expiredAuctions.auctions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Com Vencedores</p>
                  <p className="text-2xl font-bold">
                    {expiredAuctions.summary.total_with_winner}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sem Vencedores</p>
                  <p className="text-2xl font-bold">
                    {expiredAuctions.summary.total_without_winner}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor a Transferir</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(expiredAuctions.summary.total_value_to_transfer)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio Expirado</p>
                  <p className="text-2xl font-bold">
                    {(expiredAuctions.auctions
                      .reduce((sum, a) => sum + (a.expired_hours_ago || 0), 0) / expiredAuctions.auctions.length)
                      .toFixed(1)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Leilões Expirados */}
      <div className="space-y-4">
        {expiredAuctions?.auctions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum leilão expirado pendente</h3>
              <p className="text-muted-foreground">
                Todos os leilões foram processados ou não há leilões expirados no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          expiredAuctions?.auctions.map((auction) => (
            <Card key={auction.auction_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{auction.titulo}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {auction.descricao}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                      Tipo: {auction.tipo_de_ensaio} | Criador: {auction.creator.creator_name}
                    </div>
                  </div>
                  <Badge variant="destructive" className="ml-4">
                    <Clock className="h-3 w-3 mr-1" />
                    Expirado
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informações do Leilão */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Criador:</span>
                    <p className="font-medium">{auction.creator.creator_name}</p>
                    <p className="text-xs text-muted-foreground">{auction.creator.creator_nome_completo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lance Mais Alto:</span>
                    <p className="font-medium">
                      {auction.financial.highest_bid ? 
                        formatCurrency(auction.financial.highest_bid) : 
                        'Nenhum lance'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total de Lances:</span>
                    <p className="font-medium">{auction.financial.total_bids}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expirado há:</span>
                    <p className="font-medium text-orange-600">
                      {auction.expired_hours_ago ? `${auction.expired_hours_ago.toFixed(2)}h` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Informações Financeiras e de Mídia */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded">
                  <div>
                    <span className="text-muted-foreground">Preço Inicial:</span>
                    <p className="font-medium">{formatCurrency(auction.financial.initial_price)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lance Mínimo:</span>
                    <p className="font-medium">{formatCurrency(auction.financial.minimum_bid)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Imagens:</span>
                    <p className="font-medium">{auction.media_info.total_images}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vídeos:</span>
                    <p className="font-medium">{auction.media_info.total_videos}</p>
                  </div>
                </div>

                {/* Informações do Vencedor */}
                {auction.has_winner && auction.winner ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Vencedor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Usuário:</span>
                        <p className="font-medium">{auction.winner.user_name}</p>
                      </div>
                      <div>
                        <span className="text-green-700">Lance:</span>
                        <p className="font-medium">{formatCurrency(auction.winner.bid_value)}</p>
                      </div>
                      <div>
                        <span className="text-green-700">ID do Usuário:</span>
                        <p className="font-medium">{auction.winner.user_id}</p>
                      </div>
                      <div>
                        <span className="text-green-700">Data do Lance:</span>
                        <p className="font-medium">{formatDate(auction.winner.bid_created_at)}</p>
                      </div>
                    </div>
                    {auction.winner_balance && (
                      <div className="mt-2 text-xs text-green-600">
                        Saldo atual: {formatCurrency(auction.winner_balance.current_balance)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Sem vencedor</span>
                      <span className="text-yellow-600 text-sm">
                        {auction.financial.total_bids > 0 ? 
                          `${auction.financial.total_bids} lance(s) feito(s), mas nenhum venceu` : 
                          'Nenhum lance foi feito'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Status do Leilão */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="destructive">
                      {auction.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Pode Finalizar:</span>
                    <Badge variant={auction.can_be_finalized ? "default" : "secondary"}>
                      {auction.can_be_finalized ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ação Manual:</span>
                    <Badge variant={auction.requires_manual_action ? "outline" : "secondary"}>
                      {auction.requires_manual_action ? "Necessária" : "Automática"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Criador:</span>
                    <Badge variant={auction.creator.creator_status === 'aprovado' ? "default" : "secondary"}>
                      {auction.creator.creator_status}
                    </Badge>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAuction(
                        selectedAuction === auction.auction_id ? null : auction.auction_id
                      )}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {selectedAuction === auction.auction_id ? 'Ocultar' : 'Ver'} Detalhes
                    </Button>
                  </div>

                  {auction.can_be_finalized && auction.has_winner && (
                    <Button
                      onClick={() => handleFinalizeAuction(auction)}
                      disabled={processingAuctions.has(auction.auction_id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingAuctions.has(auction.auction_id) ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Coins className="h-4 w-4 mr-2" />
                          Finalizar & Transferir
                        </>
                      )}
                    </Button>
                  )}
                  
                  {!auction.can_be_finalized && (
                    <div className="text-sm text-muted-foreground bg-gray-100 p-2 rounded">
                      ⚠️ Leilão não pode ser finalizado automaticamente
                    </div>
                  )}
                  
                  {auction.can_be_finalized && !auction.has_winner && (
                    <div className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                      ⚠️ Sem vencedor para finalizar
                    </div>
                  )}
                </div>

                {/* Detalhes Expandidos */}
                {selectedAuction === auction.auction_id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Detalhes Completos
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ID do Leilão:</span>
                        <p className="font-mono">{auction.auction_id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data Prevista:</span>
                        <p>{formatDate(auction.data_prevista)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data Término:</span>
                        <p>{formatDate(auction.data_termino)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>
                        <p>{formatDate(auction.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email do Criador:</span>
                        <p>{auction.creator.creator_email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Saldo do Criador:</span>
                        <p>{formatCurrency(auction.creator_balance.current_balance)}</p>
                      </div>
                    </div>

                    {auction.has_winner && auction.winner && (
                      <div className="mt-4 p-3 bg-green-100 rounded border">
                        <h5 className="font-medium text-green-800 mb-2">Ações da Finalização:</h5>
                        <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                          <li>Confirmar vencedor: {auction.winner.user_name} (ID: {auction.winner.user_id})</li>
                          <li>Valor do lance vencedor: {formatCurrency(auction.winner.bid_value)}</li>
                          <li>Transferir valor para o criador: {formatCurrency(auction.creator_balance.balance_after_receiving)}</li>
                          <li>Liberar acesso à mídia do leilão ({auction.media_info.total_images} imagens, {auction.media_info.total_videos} vídeos)</li>
                          <li>Alterar status para &quot;finalizado&quot;</li>
                          <li>Notificar vencedor e criador por email</li>
                          <li>Registrar no histórico de transações</li>
                        </ul>
                      </div>
                    )}

                    {!auction.has_winner && (
                      <div className="mt-4 p-3 bg-yellow-100 rounded border">
                        <h5 className="font-medium text-yellow-800 mb-2">Leilão sem vencedor</h5>
                        <p className="text-yellow-700 text-sm">
                          Este leilão expirou sem vencedor. Total de lances: {auction.financial.total_bids}.
                          {auction.financial.highest_bid && (
                            ` Lance mais alto: ${formatCurrency(auction.financial.highest_bid)}.`
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}