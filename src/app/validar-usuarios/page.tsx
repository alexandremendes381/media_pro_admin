"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Search, AlertTriangle, Eye, User, Users, MapPin, Phone, Calendar, X } from "lucide-react";
import SimpleImage from "@/components/SimpleImage";
import CreatorImage from "@/components/CreatorImage";
import CreatorStepValidation from "@/components/CreatorStepValidation";
import { userValidationAPI, authAPI, apiUtils } from "@/lib/api";
import { PendingUser } from "@/types/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

function StatusBadge({ status }: { status?: 'em_analise' | 'aprovado' | 'reprovado' }) {
  const variants = {
    em_analise: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600", label: "Em Análise" },
    aprovado: { variant: "default" as const, icon: CheckCircle, color: "text-green-600", label: "Aprovado" },
    reprovado: { variant: "destructive" as const, icon: XCircle, color: "text-red-600", label: "Reprovado" },
  };

  const config = variants[status || 'em_analise'] || variants.em_analise;
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
}

export default function ValidarUsuariosPage() {
  const { isAuthenticated, isLoading: authLoading, admin } = useAuthContext();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'em_analise' | 'aprovado' | 'reprovado'>('em_analise');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [userToReject, setUserToReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedUserDocuments, setSelectedUserDocuments] = useState<{
    user_id: number;
    user_name: string;
    documents: any[];
  } | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showStepValidation, setShowStepValidation] = useState(false);
  const [selectedUserForSteps, setSelectedUserForSteps] = useState<PendingUser | null>(null);

  // Suporte ao ESC para fechar modais
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDocumentsModal) {
          closeDocumentsModal();
        } else if (showRejectModal) {
          closeRejectModal();
        }
      }
    };

    if (showDocumentsModal || showRejectModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDocumentsModal, showRejectModal]);
  
  const queryClient = useQueryClient();

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Query para buscar usuários
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers, error: usersError } = useQuery({
    queryKey: ['users', statusFilter, searchTerm, currentPage],
    queryFn: () => {
      if (statusFilter === 'em_analise' && !searchTerm) {
        return userValidationAPI.getPendingUsers(currentPage, 10);
      } else {
        return userValidationAPI.getAllUsers({
          page: currentPage,
          per_page: 10,
          status_filter: statusFilter === 'all' ? undefined : statusFilter,
          search: searchTerm || undefined,
        });
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Query para buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => userValidationAPI.getApprovalStats(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Mutation para aprovar/reprovar usuário
  const approveMutation = useMutation({
    mutationFn: ({ userId, approved, motivo }: { 
      userId: number; 
      approved: boolean;
      motivo?: string;
    }) => {
      return userValidationAPI.approveUser(userId, approved, motivo);
    },
    onSuccess: (response) => {
      // Invalidar e refazer as queries após validação bem-sucedida
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      
      toast.success(response.message || 'Operação realizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao processar usuário:', error);
      toast.error('Erro ao processar usuário: ' + error.message);
    },
  });

  const handleApproveUser = (userId: number) => {
    if (window.confirm('Tem certeza que deseja aprovar este usuário?')) {
      approveMutation.mutate({ userId, approved: true });
    }
  };

  const handleRejectUser = (userId: number) => {
    setUserToReject(userId);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor, informe o motivo da reprovação.');
      return;
    }

    if (userToReject) {
      approveMutation.mutate({ 
        userId: userToReject, 
        approved: false, 
        motivo: rejectReason.trim() 
      });
      
      setShowRejectModal(false);
      setUserToReject(null);
      setRejectReason('');
    }
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setUserToReject(null);
    setRejectReason('');
  };

  // Visualizar documentos em modal
  const viewDocuments = async (userId: number) => {
    try {
      console.log(`🔍 Abrindo documentos para usuário ${userId}`);
      setLoadingDocuments(true);
      setShowDocumentsModal(true);
      
      // Buscar dados do creator específico para ter as imagens
      console.log(`📡 Buscando dados do creator ${userId}...`);
      const creator = await userValidationAPI.getUser(userId);
      console.log(`👤 Dados do creator recebidos:`, creator);
      
      // Verificar se temos dados básicos
      if (!creator) {
        throw new Error('Creator não encontrado');
      }
      
      // Converter imagens base64 em formato de documentos
      const documents = [];
      if (creator.documento_frente) {
        console.log(`📄 Adicionando documento_frente (${creator.documento_frente.length} caracteres)`);
        documents.push({
          id: 1,
          tipo_documento: 'documento_frente' as const,
          nome_arquivo: 'documento_frente.png',
          tipo_mime: 'image/png',
          tamanho_arquivo: creator.documento_frente.length,
          base64_data: creator.documento_frente,
          created_at: creator.created_at
        });
      }
      if (creator.documento_verso) {
        console.log(`📄 Adicionando documento_verso (${creator.documento_verso.length} caracteres)`);
        documents.push({
          id: 2,
          tipo_documento: 'documento_verso' as const,
          nome_arquivo: 'documento_verso.png',
          tipo_mime: 'image/png',
          tamanho_arquivo: creator.documento_verso.length,
          base64_data: creator.documento_verso,
          created_at: creator.created_at
        });
      }
      if (creator.selfie_documento) {
        console.log(`📄 Adicionando selfie_documento (${creator.selfie_documento.length} caracteres)`);
        documents.push({
          id: 3,
          tipo_documento: 'selfie_documento' as const,
          nome_arquivo: 'selfie_documento.png',
          tipo_mime: 'image/png',
          tamanho_arquivo: creator.selfie_documento.length,
          base64_data: creator.selfie_documento,
          created_at: creator.created_at
        });
      }
      
      console.log(`📋 Total de documentos criados: ${documents.length}`, documents);
      
      setSelectedUserDocuments({
        user_id: userId,
        user_name: creator.nome_completo || creator.nome_artistico || creator.email || `Usuário ${userId}`,
        documents: documents
      });
    } catch (error: any) {
      console.error('❌ Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos: ' + error.message);
      setShowDocumentsModal(false);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fechar modal de documentos
  const closeDocumentsModal = () => {
    setShowDocumentsModal(false);
    setSelectedUserDocuments(null);
  };

  // Abrir validação por passos
  const openStepValidation = (user: PendingUser) => {
    setSelectedUserForSteps(user);
    setShowStepValidation(true);
  };

  // Fechar validação por passos
  const closeStepValidation = () => {
    setShowStepValidation(false);
    setSelectedUserForSteps(null);
  };

  // Se não autenticado, não mostrar nada (redirecionamento está acontecendo)
  if (!isAuthenticated) {
    return null;
  }

  // Se estiver na validação por passos, mostrar o componente específico
  if (showStepValidation && selectedUserForSteps) {
    return (
      <CreatorStepValidation 
        user={selectedUserForSteps}
        onBack={closeStepValidation}
      />
    );
  }

  if (usersLoading || authLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Dados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Não foi possível carregar os usuários.
            </p>
            <Button onClick={() => refetchUsers()} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = usersData?.users || [];
  const totalPages = usersData?.total_pages || 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validar Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie e valide cadastros de criadores de conteúdo
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchUsers()} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={async () => {
              // Debug das URLs e conexão
              console.log('🔧 Debug Info - Novos Endpoints:');
              console.log('API Base URL:', 'http://localhost:8000');
              console.log('Token presente:', !!localStorage.getItem('auth_token'));
              
              // Testar conectividade
              try {
                const authResponse = await fetch('http://localhost:8000/api/v1/admin/me', {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                });
                console.log('API Status:', authResponse.ok ? 'OK' : 'Error ' + authResponse.status);
                
                if (authResponse.ok) {
                  const authData = await authResponse.json();
                  console.log('Admin logado:', authData);
                }
              } catch (e) {
                console.error('API Error:', e);
              }
                
              // Testar novos endpoints se há dados
              if (users.length > 0) {
                const user = users[0];
                console.log('=== TESTANDO ENDPOINTS DE DOCUMENTOS ===');
                console.log('Dados do usuário:', user);
                
                // URL da página completa de preview
                const previewPageUrl = userValidationAPI.getDocumentPreviewURL(user.id);
                console.log('📄 URL da Página Completa:', previewPageUrl);
                
                if (user.documentos && user.documentos.length > 0) {
                  for (let i = 0; i < user.documentos.length; i++) {
                    const doc = user.documentos[i];
                    console.log(`\n--- Documento ${i + 1} ---`);
                    console.log('Dados:', doc);
                    
                    // URLs dos novos endpoints
                    const adminViewUrl = userValidationAPI.getDocumentViewURL(user.id, doc.id, doc.view_url);
                    const publicViewUrl = userValidationAPI.getPublicDocumentViewURL(doc.id);
                    const downloadUrl = userValidationAPI.getDocumentDownloadURL(user.id, doc.id, doc.download_url);
                    
                    console.log(`👁️ Admin View: ${adminViewUrl}`);
                    console.log(`🌐 Public View: ${publicViewUrl}`);
                    console.log(`📥 Download: ${downloadUrl}`);
                    
                    // Testar URL pública (não precisa de auth)
                    try {
                      const publicResponse = await fetch(publicViewUrl);
                      console.log(`🌐 Public Status: ${publicResponse.ok ? 'OK' : 'Error ' + publicResponse.status}`);
                    } catch (e) {
                      console.error(`🌐 Public Error:`, e);
                    }
                  }
                  
                  console.log('\n=== RECOMENDAÇÃO ===');
                  console.log('🎯 Para melhor experiência, use a Página Completa:');
                  console.log(`   ${previewPageUrl}`);
                } else {
                  console.log('⚠️ Usuário não possui documentos');
                }
              } else {
                console.log('❌ Nenhum usuário disponível para teste');
              }
                
              toast.success('🔧 Debug completo! Verifique o console (F12) para ver os novos endpoints e testes.');
            }} 
            variant="outline" 
            size="sm"
          >
            🔧 Debug Endpoints
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Análise</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.em_analise}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.aprovado}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reprovados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejeitado}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4 items-center flex-wrap">
        <select 
          value={statusFilter} 
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="em_analise">Em Análise</option>
          <option value="aprovado">Aprovados</option>
          <option value="reprovado">Reprovados</option>
        </select>
        
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nome, email..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="text-sm text-muted-foreground">
          Total: {usersData?.total || 0} usuários
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.request_id || user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Ícone do usuário */}
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {user.nome_completo || user.user_nome || user.user_nickname || user.user_email || `Usuário ${user.request_id || user.id}`}
                      {user.user_nickname && (
                        <span className="text-sm text-muted-foreground font-normal">
                          @{user.user_nickname}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {user.user_email} • Criado em {apiUtils.formatDate(user.created_at)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={
                    user.upgrade_status === 'pendente' ? 'em_analise' :
                    user.upgrade_status === 'aprovado' ? 'aprovado' :
                    user.upgrade_status === 'rejeitado' ? 'reprovado' :
                    user.status_da_conta || user.status || 'em_analise'
                  } />
                  {user.cpf && (
                    <Badge variant="outline">CPF: {user.cpf}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col gap-2">
                    <span className="font-medium">Imagens do Creator:</span>
                    <div className="flex gap-2 flex-wrap">
                      {/* Foto de perfil */}
                      {user.image_perfil_tipo && user.request_id && (
                        <CreatorImage
                          requestId={user.request_id}
                          imageType="image_perfil"
                          alt="Foto de perfil"
                          label="Perfil"
                          className="w-20 h-20 object-cover rounded border"
                          style={{ 
                            background: '#eee',
                            minWidth: '80px',
                            minHeight: '80px'
                          }}
                        />
                      )}
                      {/* Foto de capa */}
                      {user.image_capa_tipo && user.request_id && (
                        <CreatorImage
                          requestId={user.request_id}
                          imageType="image_capa"
                          alt="Foto de capa"
                          label="Capa"
                          className="w-20 h-20 object-cover rounded border"
                          style={{ 
                            background: '#eee',
                            minWidth: '80px',
                            minHeight: '80px'
                          }}
                        />
                      )}
                      {/* Foto do documento */}
                      {user.foto_documento_tipo && user.request_id && (
                        <CreatorImage
                          requestId={user.request_id}
                          imageType="foto_documento"
                          alt="Foto do documento"
                          label="Documento"
                          className="w-20 h-20 object-cover rounded border"
                          style={{ 
                            background: '#eee',
                            minWidth: '80px',
                            minHeight: '80px'
                          }}
                        />
                      )}
                      {/* Selfie com documento */}
                      {user.selfie_rosto_tipo && user.request_id && (
                        <CreatorImage
                          requestId={user.request_id}
                          imageType="selfie_rosto"
                          alt="Selfie com documento"
                          label="Selfie"
                          className="w-20 h-20 object-cover rounded border"
                          style={{ 
                            background: '#eee',
                            minWidth: '80px',
                            minHeight: '80px'
                          }}
                        />
                      )}
                    </div>
                  </div>
                  {/* Dados principais */}
                  {user.user_type && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Tipo:</span>
                        <p className="text-muted-foreground">{user.user_type}</p>
                      </div>
                    </div>
                  )}
                  {user.data_nascimento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Nascimento:</span>
                        <p className="text-muted-foreground">{user.data_nascimento}</p>
                      </div>
                    </div>
                  )}
                  {user.pais && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">País:</span>
                        <p className="text-muted-foreground">{user.pais}</p>
                      </div>
                    </div>
                  )}
                  {user.nome_perfil && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Perfil:</span>
                        <p className="text-muted-foreground">{user.nome_perfil}</p>
                      </div>
                    </div>
                  )}
                  {user.mediapro_username && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Username:</span>
                        <p className="text-muted-foreground">{user.mediapro_username}</p>
                      </div>
                    </div>
                  )}
                  {user.biografia && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Biografia:</span>
                        <p className="text-muted-foreground">{user.biografia}</p>
                      </div>
                    </div>
                  )}
                  {user.email_verificacao && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Email verificação:</span>
                        <p className="text-muted-foreground">{user.email_verificacao}</p>
                      </div>
                    </div>
                  )}
                  {typeof user.email_verificado === 'boolean' && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Email verificado:</span>
                        <p className="text-muted-foreground">{user.email_verificado ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                  )}
                  {(user.plano_mensal_ativo || user.plano_trimestral_ativo || user.plano_semestral_ativo) && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Planos:</span>
                        <p className="text-muted-foreground">
                          {user.plano_mensal_ativo && user.plano_mensal_valor && (
                            <>Mensal: R$ {user.plano_mensal_valor}<br /></>
                          )}
                          {user.plano_trimestral_ativo && user.plano_trimestral_valor && (
                            <>Trimestral: R$ {user.plano_trimestral_valor}<br /></>
                          )}
                          {user.plano_semestral_ativo && user.plano_semestral_valor && (
                            <>Semestral: R$ {user.plano_semestral_valor}</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedUser === (user.request_id || user.id) && (
                  <div className="pt-4 border-t">
                    <div className="space-y-3">
                      {(user.motivo_rejeicao || user.motivo_reprovacao) && (
                        <div>
                          <span className="font-medium">Motivo da Reprovação:</span>
                          <p className="text-muted-foreground text-sm bg-red-50 p-2 rounded">
                            {user.motivo_rejeicao || user.motivo_reprovacao}
                          </p>
                        </div>
                      )}
                      {user.approved_at && (
                        <div>
                          <span className="font-medium">Data de Aprovação:</span>
                          <p className="text-muted-foreground text-sm">{apiUtils.formatDate(user.approved_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t flex-wrap">
                  {/* Novo botão principal: Validação por Passos */}
                  {user.request_id && (
                    <Button 
                      size="sm" 
                      onClick={() => openStepValidation(user)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Validar por Passos
                    </Button>
                  )}

                  {(user.status_da_conta || user.status) === 'em_analise' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleApproveUser(user.id)}
                        disabled={approveMutation.isPending}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar Tudo
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleRejectUser(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reprovar Tudo
                      </Button>
                    </>
                  )}
                  {(() => {
                    // Verificar se tem documentos no formato antigo OU novo
                    const hasLegacyDocs = user.documentos && user.documentos.length > 0;
                    const hasNewDocs = user.documento_frente || user.documento_verso || user.selfie_documento;
                    
                    return (hasLegacyDocs || hasNewDocs) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewDocuments(user.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Documentos
                      </Button>
                    );
                  })()}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {selectedUser === user.id ? 'Ocultar' : 'Ver'} Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground text-center">
              Não há usuários {statusFilter !== 'all' ? `${statusFilter === 'em_analise' ? 'em análise' : statusFilter}` : ''} no momento.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Documentos */}
      {showDocumentsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Fechar modal ao clicar fora dele
            if (e.target === e.currentTarget) {
              closeDocumentsModal();
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header do Modal */}
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar do usuário no modal */}
                    {selectedUserDocuments && (
                      <div className="flex items-center justify-center w-10 h-10 bg-white/20 text-white rounded-full border-2 border-white">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-xl font-semibold">📄 Documentos do Usuário</h2>
                      {selectedUserDocuments && (
                        <p className="text-gray-300 mt-1">
                          {selectedUserDocuments.user_name} • Total: {selectedUserDocuments.documents.length} documento{selectedUserDocuments.documents.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mr-4">
                    {selectedUserDocuments && (
                      <a 
                        href={userValidationAPI.getDocumentPreviewURL(selectedUserDocuments.user_id)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                        >
                          🖼️ Página Completa
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeDocumentsModal}
                className="text-white hover:bg-gray-700 transition-colors"
                title="Fechar modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando documentos...</p>
                  </div>
                </div>
              ) : selectedUserDocuments?.documents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">⚠️ Nenhum documento encontrado</h3>
                  <p className="text-muted-foreground">Este usuário ainda não enviou documentos.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedUserDocuments?.documents.map((doc, index) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          📋 {formatDocumentType(doc.tipo_documento)}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <a 
                            href={userValidationAPI.getDocumentDownloadURL(selectedUserDocuments.user_id, doc.id, doc.download_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              📥 Download
                            </Button>
                          </a>
                          <a 
                            href={userValidationAPI.getDocumentViewURL(selectedUserDocuments.user_id, doc.id, doc.view_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              👁️ Ver Original
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Informações do documento */}
                      <div className="bg-white p-4 rounded-md mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">🖼️ Arquivo:</span>
                          <p className="text-gray-600">{doc.nome_arquivo || doc.nome_imagem || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">📊 Tamanho:</span>
                          <p className="text-gray-600">{((doc.tamanho_arquivo || doc.tamanho_imagem || 0) / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">🗂️ Tipo:</span>
                          <p className="text-gray-600">{doc.tipo_mime}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">📅 Enviado em:</span>
                          <p className="text-gray-600">{new Date(doc.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Preview da imagem */}
                      {(doc.tipo_mime?.startsWith('image/') || doc.base64_data) ? (
                        <div className="bg-white p-4 rounded-md border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <div className="flex justify-center">
                              <SimpleImage
                                userId={selectedUserDocuments.user_id}
                                documentId={doc.id}
                                documentType={doc.tipo_documento}
                                viewUrl={doc.view_url}
                                base64Data={doc.base64_data}
                                alt={`${formatDocumentType(doc.tipo_documento)}`}
                                className="max-w-full max-h-96 rounded-lg shadow-sm border border-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                          <p className="text-orange-700 text-sm text-center">
                            <em>🔍 Preview não disponível para este tipo de arquivo. Use os botões &quot;Visualizar&quot; ou &quot;Download&quot; acima.</em>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedUserDocuments && (
                  <span>
                    Mostrando {selectedUserDocuments.documents.length} documento{selectedUserDocuments.documents.length !== 1 ? 's' : ''} para {selectedUserDocuments.user_name}
                  </span>
                )}
              </div>
              <Button onClick={closeDocumentsModal} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reprovação */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reprovar Usuário</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Motivo da reprovação:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o motivo da reprovação..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeRejectModal}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                >
                  Reprovar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Função auxiliar para formatar tipo de documento
  function formatDocumentType(tipo: string): string {
    const types = {
      'documento_frente': 'Documento - Frente',
      'documento_verso': 'Documento - Verso',
      'selfie_documento': 'Selfie com Documento'
    };
    return types[tipo as keyof typeof types] || tipo;
  }
}