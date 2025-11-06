"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Search, Eye, Calendar, Users } from "lucide-react";
import api from "@/lib/api";
import { Auction } from "@/types/api";
import { toast } from "sonner";

// Componente para testar carregamento de imagens
const TestImage = ({ src, alt, className, onLoad }: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log('🔍 Tentando carregar imagem:', src);
    
    // Testa se a URL é acessível com token de autenticação
    const token = localStorage.getItem('adminToken');
    fetch(src, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    })
      .then(response => {
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        if (response.ok) {
          console.log('✅ URL da imagem está acessível');
        } else {
          console.error('❌ URL da imagem retornou erro:', response.status, response.statusText);
          setError(true);
        }
      })
      .catch(err => {
        console.error('❌ Erro ao testar URL da imagem:', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [src]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 text-sm h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-2"></div>
        <div>Testando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 text-sm h-full">
        <div className="mb-2">❌</div>
        <div>Erro 500</div>
        <div className="text-xs text-red-500">Backend indisponível</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={src}
        alt={alt}
        className={className}
        onLoad={() => {
          console.log('✅ Imagem carregada com sucesso!');
          if (onLoad) onLoad();
        }}
        onError={(e) => {
          console.error('❌ Erro ao renderizar imagem:', e);
          setError(true);
        }}
      />
      {/* Overlay com link direto para debug */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline"
        >
          🔗 Testar
        </a>
      </div>
    </div>
  );
};

// Hook para buscar leilões da API
const useAuctions = (status?: 'em_analise' | 'aprovado' | 'rejeitado') => {
  return useQuery({
    queryKey: ['auctions', status],
    queryFn: () => api.auctions.getAllAuctions(status),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};

// Função para mapear o status da API para status de exibição
const mapStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'em_analise': 'pendente',
    'aprovado': 'aprovado',
    'rejeitado': 'rejeitado'
  };
  return statusMap[status] || status;
};

function StatusBadge({ status }: { status: string }) {
  const mappedStatus = mapStatus(status);
  const variants = {
    pendente: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
    aprovado: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
    rejeitado: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
  };

  const config = variants[mappedStatus as keyof typeof variants];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {mappedStatus.charAt(0).toUpperCase() + mappedStatus.slice(1)}
    </Badge>
  );
}

export default function ValidarLeilaoPage() {
  const [selectedAuction, setSelectedAuction] = useState<number | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Busca todos os leilões (incluindo pendentes)
  const { data: auctions, isLoading, refetch } = useAuctions();

  // Mutations para aprovar/rejeitar leilões
  const approveMutation = useMutation({
    mutationFn: (auctionId: number) => api.auctions.approveAuction(auctionId),
    onSuccess: (data) => {
      toast.success(`Leilão "${data.titulo}" aprovado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar leilão: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (auctionId: number) => api.auctions.rejectAuction(auctionId),
    onSuccess: (data) => {
      toast.success(`Leilão "${data.titulo}" rejeitado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar leilão: ${error.message}`);
    },
  });

  const handleValidateAuction = (id: number, action: 'aprovar' | 'rejeitar') => {
    if (action === 'aprovar') {
      approveMutation.mutate(id);
    } else {
      rejectMutation.mutate(id);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutos`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours} horas`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} dias`;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando leilões para validação...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validar Leilão</h1>
          <p className="text-muted-foreground">
            Revise e aprove leilões antes da publicação
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-6">
        {auctions?.map((auction) => (
          <Card key={auction.id} className="transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{auction.titulo}</CardTitle>
                  <CardDescription className="text-base">
                    Por: {auction.creator_nome} ({auction.creator_nome_artistico}) • {auction.creator_email}
                  </CardDescription>
                </div>
                <StatusBadge status={auction.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {auction.descricao}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">Data Prevista</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(auction.data_prevista)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duração: {formatDuration(auction.duracao_do_leilao)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">Imagens</p>
                      <p className="text-xs text-muted-foreground">
                        {auction.total_images || 0} item{(auction.total_images || 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">Vídeos</p>
                      <p className="text-xs text-muted-foreground">
                        {auction.total_videos || 0} vídeos
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium">Preços</p>
                    <p className="text-sm font-semibold text-primary">
                      Inicial: {formatCurrency(auction.preco_inicial)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lance mín: {formatCurrency(auction.lance_minimo)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {auction.tipo_de_ensaio}
                  </Badge>
                </div>

                {auction.status === 'em_analise' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      onClick={() => handleValidateAuction(auction.id, 'aprovar')}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {approveMutation.isPending && approveMutation.variables === auction.id ? 'Aprovando...' : 'Aprovar Leilão'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleValidateAuction(auction.id, 'rejeitar')}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {rejectMutation.isPending && rejectMutation.variables === auction.id ? 'Rejeitando...' : 'Rejeitar Leilão'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedAuction(selectedAuction === auction.id ? null : auction.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                )}

                {/* Botão Ver Documentos disponível para todos os status */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedDocuments(selectedDocuments === auction.id ? null : auction.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Documentos ({(auction.total_images || 0) + (auction.total_videos || 0)})
                  </Button>
                </div>

                {selectedAuction === auction.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold mb-2">Detalhes Adicionais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">ID do Leilão:</span>
                        <p className="text-muted-foreground">#{auction.id}</p>
                      </div>
                      <div>
                        <span className="font-medium">Data de Criação:</span>
                        <p className="text-muted-foreground">{formatDate(auction.created_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Última Atualização:</span>
                        <p className="text-muted-foreground">{formatDate(auction.updated_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Creator:</span>
                        <p className="text-muted-foreground">{auction.creator_nome}</p>
                      </div>
                      <div>
                        <span className="font-medium">Nome Artístico:</span>
                        <p className="text-muted-foreground">{auction.creator_nome_artistico}</p>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <p className="text-muted-foreground">{auction.creator_email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status Atual:</span>
                        <p className="text-muted-foreground">
                          {auction.status === 'rejeitado' ? 'Rejeitado' : 
                           auction.status === 'aprovado' ? 'Aprovado' : 'Em Análise'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Tipo de Ensaio:</span>
                        <p className="text-muted-foreground">{auction.tipo_de_ensaio}</p>
                      </div>
                      <div>
                        <span className="font-medium">Preço Inicial:</span>
                        <p className="text-muted-foreground">{formatCurrency(auction.preco_inicial)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Lance Mínimo:</span>
                        <p className="text-muted-foreground text-green-600 font-semibold">{formatCurrency(auction.lance_minimo)}</p>
                      </div>
                    </div>

                    {/* Exibir imagens se existirem */}
                    {auction.images_urls && auction.images_urls.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Imagens ({auction.images_urls.length})</h5>
                        <div className="flex flex-wrap gap-2">
                          {auction.images_urls.slice(0, 3).map((url, index) => (
                            <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Imagem {index + 1}
                            </div>
                          ))}
                          {auction.images_urls.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{auction.images_urls.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exibir vídeos se existirem */}
                    {auction.videos_urls && auction.videos_urls.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Vídeos ({auction.videos_urls.length})</h5>
                        <div className="flex flex-wrap gap-2">
                          {auction.videos_urls.slice(0, 3).map((url, index) => (
                            <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Vídeo {index + 1}
                            </div>
                          ))}
                          {auction.videos_urls.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{auction.videos_urls.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Seção de Documentos (Imagens e Vídeos) */}
                {selectedDocuments === auction.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold mb-4">Documentos do Leilão</h4>
                    
                    {/* Seção de Imagens */}
                    {auction.images_urls && auction.images_urls.length > 0 ? (
                      <div className="mb-6">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Imagens ({auction.images_urls.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {auction.images_urls.map((url, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden bg-white">
                              <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                                {url ? (
                                  <TestImage
                                    src={`http://localhost:8000${url}`}
                                    alt={`Imagem ${index + 1} do leilão ${auction.titulo}`}
                                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                                    onLoad={() => {
                                      console.log(`✅ Imagem ${index + 1} carregada com sucesso: ${url}`);
                                    }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-500 text-sm h-full">
                                    <div className="mb-2">📷</div>
                                    <div>Imagem {index + 1}</div>
                                    <span className="text-xs text-orange-500">URL não disponível</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-2">
                                <p className="text-xs text-muted-foreground truncate">
                                  Imagem {index + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Imagens (0)
                        </h5>
                        <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded border">
                          Nenhuma imagem foi enviada para este leilão.
                        </div>
                      </div>
                    )}

                    {/* Seção de Vídeos */}
                    {auction.videos_urls && auction.videos_urls.length > 0 ? (
                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Vídeos ({auction.videos_urls.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {auction.videos_urls.map((url, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden bg-white">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                {url ? (
                                  <video 
                                    src={`http://localhost:8000${url}`}
                                    controls
                                    className="w-full h-full object-contain"
                                    preload="metadata"
                                    onError={(e) => {
                                      const target = e.target as HTMLVideoElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="flex flex-col items-center justify-center text-gray-500 text-sm h-full"><div class="mb-2">🎬</div><div>Vídeo ${index + 1}</div><div class="text-xs text-red-500">Erro ao carregar</div></div>`;
                                      }
                                    }}
                                  >
                                    Seu navegador não suporta o elemento de vídeo.
                                  </video>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-gray-500 text-sm h-full">
                                    <div className="mb-2">🎬</div>
                                    <div>Vídeo {index + 1}</div>
                                    <span className="text-xs text-orange-500">URL não disponível</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-2">
                                <p className="text-xs text-muted-foreground truncate">
                                  Vídeo {index + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Vídeos (0)
                        </h5>
                        <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded border">
                          Nenhum vídeo foi enviado para este leilão.
                        </div>
                      </div>
                    )}

                    {/* Informações adicionais sobre os documentos */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total de Arquivos:</span>
                          <p className="text-muted-foreground">
                            {(auction.total_images || 0) + (auction.total_videos || 0)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Última Atualização:</span>
                          <p className="text-muted-foreground">{formatDate(auction.updated_at)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <p className="text-muted-foreground">
                            {auction.status === 'rejeitado' ? 'Rejeitado' : 
                             auction.status === 'aprovado' ? 'Aprovado' : 'Em Análise'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!auctions || auctions.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum leilão encontrado</h3>
            <p className="text-muted-foreground text-center">
              Não há leilões pendentes para validação no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}