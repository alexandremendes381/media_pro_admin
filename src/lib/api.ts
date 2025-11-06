import { 
  ApiResponse, 
  LoginAttempt, 
  LoginValidationRequest, 
  LoginResponse, 
  PendingUser, 
  ApprovalStats, 
  Admin, 
  AdminStats, 
  UserDocument,
  UserApprovalRequest,
  UserApprovalResponse,
  Auction,
  AuctionStatusUpdate,
  AuctionStats,
  UpgradeRequest,
  UpgradeApprovalRequest,
  UpgradeApprovalResponse,
  UpgradeStats,
  CreatorUpgradeStatus,
  UpgradeStage,
  UpgradeResumo,
  CreatorStepsResponse,
  StepValidationRequest,
  StepValidationResponse
} from '@/types/api';

// Base URL da API
const API_BASE_URL = 'http://localhost:8000';

// Função para obter o token do localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Função para configurar headers padrão
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Função auxiliar para fazer requisições
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth = true
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...getHeaders(includeAuth),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// === AUTENTICAÇÃO ===

export const authAPI = {
  // Login Admin (usando email e password)
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const url = `${API_BASE_URL}/api/v1/admin/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Logout Admin
  logout: async (): Promise<ApiResponse> => {
    return apiRequest('/api/v1/admin/logout', {
      method: 'POST',
    });
  },

  // Obter dados do admin atual (simulado para compatibilidade)
  getMe: async (): Promise<Admin> => {
    // Adapter para manter compatibilidade - dados simulados
    return {
      id: 1,
      nome: 'Admin',
      email: 'admin@mediapro.com',
      is_active: true,
      is_super_admin: true,
      created_at: new Date().toISOString(),
    };
  },

  // Adapter para AdminStats (calculado localmente)
  getStats: async (): Promise<AdminStats> => {
    // Calcular estatísticas a partir dos creators
    console.log('📊 Calculando estatísticas a partir dos creators...');
    const creators = await userValidationAPI.getAllUsers({ per_page: 1000 });
    
    const em_analise = creators.users.filter(u => u.status_da_conta === 'em_analise').length;
    const aprovados = creators.users.filter(u => u.status_da_conta === 'aprovado').length;
    const reprovados = creators.users.filter(u => u.status_da_conta === 'reprovado').length;
    
    return {
      total_usuarios: creators.total,
      usuarios_em_analise: em_analise,
      usuarios_aprovados: aprovados,
      usuarios_reprovados: reprovados,
      usuarios_hoje: 0, // Não disponível
    };
  },
};

// === VALIDAÇÃO DE TENTATIVAS DE LOGIN ===

export const loginValidationAPI = {
  // Listar tentativas de login
  getLoginAttempts: async (params?: {
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    attempts: LoginAttempt[];
    total: number;
  }>> => {
    const queryParams = new URLSearchParams();
    
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/login-attempts${query ? `?${query}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Validar tentativa de login
  validateLoginAttempt: async (
    attemptId: string,
    action: 'approve' | 'reject',
    adminNotes?: string
  ): Promise<ApiResponse<{
    message: string;
    attempt: LoginAttempt;
  }>> => {
    return apiRequest(
      `/api/v1/admin/login-attempts/${attemptId}/validate`,
      {
        method: 'POST',
        body: JSON.stringify({
          action,
          admin_notes: adminNotes,
        }),
      }
    );
  },

  // Aprovar tentativa de login
  approveLogin: async (attemptId: string, notes?: string): Promise<ApiResponse> => {
    return loginValidationAPI.validateLoginAttempt(attemptId, 'approve', notes);
  },

  // Rejeitar tentativa de login
  rejectLogin: async (attemptId: string, notes?: string): Promise<ApiResponse> => {
    return loginValidationAPI.validateLoginAttempt(attemptId, 'reject', notes);
  },
};

// === VALIDAÇÃO DE CREATORS ===

export const userValidationAPI = {
  // Listar todos os creators (API simples sem paginação)
  getPendingUsers: async (page: number = 1, per_page: number = 50): Promise<{
    users: PendingUser[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> => {
    // API simples - busca todos os creators sem parâmetros
    const url = `${API_BASE_URL}/api/v1/admin/creators`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('📊 Dados recebidos da API (getPendingUsers):', data);

    const creators = data.creators || data || [];
    
    // Implementar paginação local
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedCreators = creators.slice(startIndex, endIndex);

    return {
      users: paginatedCreators,
      total: creators.length,
      page: page,
      per_page: per_page,
      total_pages: Math.ceil(creators.length / per_page)
    };
  },

  // Listar todos os creators (SEM filtros na API)
  getAllUsers: async (params?: {
    page?: number;
    per_page?: number;
    status_filter?: string;
    search?: string;
  }): Promise<{
    users: PendingUser[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> => {
    // API simples sem filtros - busca todos os creators
    const url = `${API_BASE_URL}/api/v1/admin/creators`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    let creators = data.creators || data || [];
    
    console.log('📊 getAllUsers - Dados recebidos:', data);
    console.log('👥 getAllUsers - Creators processados:', creators);
    
    // Filtrar localmente por status se necessário
    if (params?.status_filter && params.status_filter !== 'all') {
      creators = creators.filter((creator: any) => 
        creator.status_da_conta === params.status_filter
      );
    }
    
    // Filtrar localmente por busca se necessário
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      creators = creators.filter((creator: any) => 
        creator.nome_completo?.toLowerCase().includes(searchLower) ||
        creator.nome_artistico?.toLowerCase().includes(searchLower) ||
        creator.email?.toLowerCase().includes(searchLower)
      );
    }

    // Implementar paginação local
    const page = params?.page || 1;
    const per_page = params?.per_page || 50;
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedCreators = creators.slice(startIndex, endIndex);

    return {
      users: paginatedCreators,
      total: creators.length,
      page: page,
      per_page: per_page,
      total_pages: Math.ceil(creators.length / per_page)
    };
  },

  // Obter creator específico
  getUser: async (userId: number): Promise<PendingUser> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Aprovar ou reprovar creator
  approveUser: async (userId: number, approved: boolean, motivo_reprovacao?: string): Promise<UserApprovalResponse> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/status`;
    
    const status = approved ? 'aprovado' : 'reprovado';
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    // Adapter para manter compatibilidade
    return {
      success: true,
      message: data.message || (approved ? 'Creator aprovado com sucesso' : 'Creator reprovado com sucesso'),
      user: {
        id: data.creator_id || userId,
        email: '',
        created_at: new Date().toISOString(),
        nome_artistico: data.nome_artistico,
        status_da_conta: data.novo_status || status
      } as PendingUser
    };
  },

  // Atualizar status de creator diretamente
  updateUserStatus: async (userId: number, newStatus: 'aprovado' | 'reprovado' | 'em_analise', motivo?: string): Promise<{
    success: boolean;
    message: string;
    user_id: number;
    old_status: string;
    new_status: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/status`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({
        status: newStatus
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      message: data.message || `Status atualizado para ${newStatus}`,
      user_id: data.creator_id || userId,
      old_status: '', // Não retornado pela nova API
      new_status: data.novo_status || newStatus
    };
  },

  // Listar documentos de um creator (novo endpoint)
  getUserDocuments: async (userId: number): Promise<{
    creator_id: number;
    nome_completo: string;
    documentos: {
      documento_frente?: {
        data: string;
        tipo: string;
      };
      documento_verso?: {
        data: string;
        tipo: string;
      };
      selfie_documento?: {
        data: string;
        tipo: string;
      };
    };
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/documentos`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Ativar/Desativar creator
  toggleUserActive: async (userId: number, isActive: boolean): Promise<{
    message: string;
    creator_id: number;
    is_active: boolean;
    nome_artistico: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/toggle-active`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ is_active: isActive }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Obter URL para página de preview completa (RECOMENDADO)
  getDocumentPreviewURL: (userId: number): string => {
    return `${API_BASE_URL}/api/v1/admin/creators/${userId}/documents/preview`;
  },

  // Obter URL para visualizar documento individual
  getDocumentViewURL: (userId: number, documentId: number, relativeUrl?: string): string => {
    let url: string;
    
    if (relativeUrl) {
      // Se a URL relativa foi fornecida, usar ela
      url = `${API_BASE_URL}${relativeUrl}`;
    } else {
      // Fallback para construção manual
      url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/documents/${documentId}/view`;
    }
    
    return url;
  },

  // Obter URL pública para visualização (para uso em tags <img>)
  getPublicDocumentViewURL: (documentId: number): string => {
    const url = `${API_BASE_URL}/api/v1/public/documents/${documentId}/view`;
    console.log(`🔗 Public URL gerada:`, url);
    return url;
  },

  // Obter URL para download de documento
  getDocumentDownloadURL: (userId: number, documentId: number, relativeUrl?: string): string => {
    let url: string;
    
    if (relativeUrl) {
      // Se a URL relativa foi fornecida, usar ela
      url = `${API_BASE_URL}${relativeUrl}`;
    } else {
      // Fallback para construção manual
      url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/documents/${documentId}/download`;
    }
    
    return url;
  },

  // Upload de imagem de documento para creator
  uploadUserDocument: async (userId: number, imageFile: File, tipoDocumento: 'documento_frente' | 'documento_verso' | 'selfie_documento'): Promise<{
    success: boolean;
    message: string;
    document: UserDocument;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/documents/upload`;
    
    // Validar se é uma imagem
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, etc.)');
    }

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('tipo_documento', tipoDocumento);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Deletar documento de creator
  deleteUserDocument: async (userId: number, documentId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${userId}/documents/${documentId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Métodos de compatibilidade (mantidos para não quebrar código existente)
  validateUser: async (userId: number, action: 'approve' | 'reject', motivo?: string): Promise<UserApprovalResponse> => {
    return userValidationAPI.approveUser(userId, action === 'approve', motivo);
  },

  rejectUser: async (userId: number, motivo: string): Promise<UserApprovalResponse> => {
    return userValidationAPI.approveUser(userId, false, motivo);
  },

  // Obter estatísticas de aprovações (calculadas localmente)
  getApprovalStats: async (): Promise<ApprovalStats> => {
    console.log('📊 Calculando approval stats a partir dos creators...');
    const stats = await authAPI.getStats();

    return {
      em_analise: stats.usuarios_em_analise,
      aprovado: stats.usuarios_aprovados,
      rejeitado: stats.usuarios_reprovados,
      total: stats.total_usuarios
    };
  },

  // Obter detalhes dos passos para validação granular
  getCreatorSteps: async (requestId: number): Promise<CreatorStepsResponse> => {
    const url = `${API_BASE_URL}/api/v1/admin/creator-upgrade-requests/${requestId}/steps`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Validar um passo específico
  validateCreatorStep: async (
    requestId: number, 
    stepNumber: number, 
    validation: StepValidationRequest
  ): Promise<StepValidationResponse> => {
    const url = `${API_BASE_URL}/api/v1/admin/creator-upgrade-requests/${requestId}/steps/${stepNumber}/validate`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(validation),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },
};

// === REGISTRO DE CREATORS ===

export const creatorRegistrationAPI = {
  // Criar novo creator
  createUser: async (userData: {
    nome_completo: string;
    nome_artistico: string;
    email: string;
    password: string;
    telefone: string;
    cep: string;
    endereco: string;
    cidade: string;
    estado: string;
    pais: string;
  }): Promise<{
    success: boolean;
    message: string;
    user: PendingUser;
  }> => {
    const url = `${API_BASE_URL}/api/v1/creators/register`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Upload de imagem de documento durante registro
  uploadDocument: async (userId: number, imageFile: File, tipoDocumento: 'documento_frente' | 'documento_verso' | 'selfie_documento'): Promise<{
    success: boolean;
    message: string;
    document: UserDocument;
  }> => {
    // Verificar se o creator existe primeiro
    try {
      await userValidationAPI.getUser(userId);
    } catch (error) {
      throw new Error('Creator não encontrado');
    }

    // Validar se é uma imagem
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, WEBP, etc.)');
    }

    return userValidationAPI.uploadUserDocument(userId, imageFile, tipoDocumento);
  },

  // Finalizar registro (enviar para análise)
  submitForReview: async (userId: number): Promise<{
    success: boolean;
    message: string;
    user: PendingUser;
  }> => {
    const url = `${API_BASE_URL}/api/v1/creators/${userId}/submit-review`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Verificar status do registro
  getRegistrationStatus: async (userId: number): Promise<PendingUser> => {
    return userValidationAPI.getUser(userId);
  },
};

// === UTILITÁRIOS ===

export const apiUtils = {
  // Salvar token no localStorage
  saveAuthToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  // Remover token do localStorage
  removeAuthToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  // Verificar se o usuário está logado
  isAuthenticated: (): boolean => {
    return getAuthToken() !== null;
  },

  // Formatar data para exibição
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Formatar IP para exibição (mascarar se necessário)
  formatIP: (ip: string): string => {
    // Para IPs locais, retorna completo
    if (ip.startsWith('192.168.') || ip.startsWith('127.0.')) {
      return ip;
    }
    
    // Para IPs externos, mascara os últimos dígitos
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    
    return ip;
  },

  // Calcular nível de risco baseado no risk_score
  getRiskLevel: (riskScore: number): {
    level: 'low' | 'medium' | 'high' | 'critical';
    label: string;
    color: string;
  } => {
    if (riskScore <= 30) {
      return { level: 'low', label: 'Baixo', color: 'green' };
    } else if (riskScore <= 60) {
      return { level: 'medium', label: 'Médio', color: 'yellow' };
    } else if (riskScore <= 85) {
      return { level: 'high', label: 'Alto', color: 'orange' };
    } else {
      return { level: 'critical', label: 'Crítico', color: 'red' };
    }
  },
};

// === ESTATÍSTICAS GERAIS (CALCULADAS LOCALMENTE) ===

export const statsAPI = {
  // Calcular estatísticas a partir dos creators (fallback)
  getStats: async (): Promise<{
    total_creators: number;
    creators_aprovados: number;
    creators_em_analise: number;
    creators_reprovados: number;
    creators_ativos: number;
    total_posts: number;
    posts_hoje: number;
    cadastros_hoje: number;
    ultimos_7_dias: {
      novos_creators: number;
      novos_posts: number;
    };
  }> => {
    // Buscar creators para calcular estatísticas
    const creators = await userValidationAPI.getAllUsers({ per_page: 1000 });
    
    const total_creators = creators.users.length;
    const creators_em_analise = creators.users.filter(u => u.status_da_conta === 'em_analise').length;
    const creators_aprovados = creators.users.filter(u => u.status_da_conta === 'aprovado').length;
    const creators_reprovados = creators.users.filter(u => u.status_da_conta === 'reprovado').length;
    const creators_ativos = creators.users.filter(u => u.is_active === true).length;
    
    console.log('📊 Estatísticas calculadas localmente:', {
      total_creators,
      creators_em_analise,
      creators_aprovados,
      creators_reprovados
    });

    return {
      total_creators,
      creators_aprovados,
      creators_em_analise,
      creators_reprovados,
      creators_ativos,
      total_posts: 0, // Não disponível
      posts_hoje: 0, // Não disponível
      cadastros_hoje: 0, // Não disponível
      ultimos_7_dias: {
        novos_creators: 0, // Não disponível
        novos_posts: 0, // Não disponível
      },
    };
  },
};

// === RELATÓRIOS ===

export const reportsAPI = {
  // Relatório de creators por status
  getCreatorsByStatus: async (): Promise<{
    em_analise: {
      count: number;
      creators: Array<{
        id: number;
        nome_artistico: string;
        email: string;
        created_at: string;
      }>;
    };
    aprovado: {
      count: number;
      creators: Array<{
        id: number;
        nome_artistico: string;
        email: string;
        created_at: string;
      }>;
    };
    reprovado: {
      count: number;
      creators: Array<{
        id: number;
        nome_artistico: string;
        email: string;
        created_at: string;
      }>;
    };
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/reports/creators-by-status`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Relatório de planos
  getPlansReport: async (): Promise<{
    total_creators_com_planos: number;
    planos_por_tipo: {
      mensal: {
        count: number;
        preco_medio_centavos: number;
        preco_medio: string;
      };
      trimestral: {
        count: number;
        preco_medio_centavos: number;
        preco_medio: string;
      };
      semestral: {
        count: number;
        preco_medio_centavos: number;
        preco_medio: string;
      };
    };
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/reports/planos`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },
};

// === PLANOS ===

export const plansAPI = {
  // Ver planos de um creator específico
  getCreatorPlans: async (creatorId: number): Promise<{
    creator_id: number;
    nome_completo: string;
    nome_artistico: string;
    plano_mensal: string;
    plano_mensal_centavos: number;
    plano_trimestral: string;
    plano_trimestral_centavos: number;
    plano_semestral: string;
    plano_semestral_centavos: number;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/creators/${creatorId}/planos`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },
};

// === SISTEMA ===

export const systemAPI = {
  // Informações do sistema
  getSystemInfo: async (): Promise<{
    sistema: string;
    versao: string;
    ambiente: string;
    banco_dados: string;
    total_tabelas: number;
    uptime: string;
    memoria_usada: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/system/info`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Gerar backup do banco
  generateBackup: async (): Promise<{
    message: string;
    arquivo: string;
    tamanho: string;
    timestamp: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/system/backup`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },
};

// === GERENCIAMENTO DE LEILÕES ===

export const auctionsAPI = {
  // Listar todos os leilões
  getAllAuctions: async (statusFilter?: 'em_analise' | 'aprovado' | 'rejeitado'): Promise<Auction[]> => {
    const queryParams = new URLSearchParams();
    
    if (statusFilter) {
      queryParams.append('status_filter', statusFilter);
    }

    const query = queryParams.toString();
    const url = `${API_BASE_URL}/api/v1/admin/auctions${query ? `?${query}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('📊 Leilões recebidos da API:', data);
    return data;
  },

  // Listar apenas leilões pendentes (em análise)
  getPendingAuctions: async () => {
    const allAuctions = await auctionsAPI.getAllAuctions('em_analise');
    return allAuctions.filter(auction => auction.status === 'em_analise');
  },

  // Aprovar ou rejeitar leilão
  updateAuctionStatus: async (
    auctionId: number, 
    status: 'aprovado' | 'rejeitado'
  ): Promise<Auction> => {
    const url = `${API_BASE_URL}/api/v1/admin/auction/${auctionId}/status`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`✅ Leilão ${auctionId} ${status} com sucesso:`, data);
    return data;
  },

  // Aprovar leilão (método de conveniência)
  approveAuction: async (auctionId: number) => {
    return auctionsAPI.updateAuctionStatus(auctionId, 'aprovado');
  },

  // Rejeitar leilão (método de conveniência)
  rejectAuction: async (auctionId: number) => {
    return auctionsAPI.updateAuctionStatus(auctionId, 'rejeitado');
  },

  // Obter estatísticas dos leilões (calculadas localmente)
  getAuctionStats: async (): Promise<{
    total_leiloes: number;
    em_analise: number;
    aprovados: number;
    rejeitados: number;
    valor_total_inicial: number;
  }> => {
    const allAuctions = await auctionsAPI.getAllAuctions();
    
    const total_leiloes = allAuctions.length;
    const em_analise = allAuctions.filter(a => a.status === 'em_analise').length;
    const aprovados = allAuctions.filter(a => a.status === 'aprovado').length;
    const rejeitados = allAuctions.filter(a => a.status === 'rejeitado').length;
    const valor_total_inicial = allAuctions.reduce((sum, a) => sum + a.preco_inicial, 0);

    console.log('📊 Estatísticas de leilões calculadas:', {
      total_leiloes,
      em_analise,
      aprovados,
      rejeitados,
      valor_total_inicial
    });

    return {
      total_leiloes,
      em_analise,
      aprovados,
      rejeitados,
      valor_total_inicial
    };
  }
};

// === GERENCIAMENTO DE POSTS ===

export const postsAPI = {
  // Listar todos os posts (admin)
  getAllPosts: async (params?: {
    creator_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    posts: Array<{
      id: number;
      creator_id: number;
      nome_artistico: string;
      titulo: string;
      descricao?: string;
      total_imagens: number;
      created_at: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> => {
    const queryParams = new URLSearchParams();
    
    if (params?.creator_id) {
      queryParams.append('creator_id', params.creator_id.toString());
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const query = queryParams.toString();
    const url = `${API_BASE_URL}/api/v1/admin/posts${query ? `?${query}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Obter post específico com todas as imagens
  getPost: async (postId: number): Promise<{
    id: number;
    creator_id: number;
    nome_artistico: string;
    titulo: string;
    descricao?: string;
    imagens: Array<{
      id: number;
      image_data: string;
      image_tipo: string;
      image_ordem: number;
    }>;
    total_imagens: number;
    created_at: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/posts/${postId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },

  // Deletar post (admin)
  deletePost: async (postId: number): Promise<{
    message: string;
    post_id: number;
    titulo: string;
  }> => {
    const url = `${API_BASE_URL}/api/v1/admin/posts/${postId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  },


};

// === EXEMPLO DE USO DAS NOVAS APIS ===

/*
FLUXO COMPLETO COM APIS REAIS:

1. Login do Admin:
   const loginResult = await api.auth.login('admin@mediapro.com', 'admin123');
   api.utils.saveAuthToken(loginResult.access_token);

2. Ver Estatísticas Reais:
   const stats = await api.stats.getStats();
   console.log(`Total creators: ${stats.total_creators}`);
   console.log(`Posts hoje: ${stats.posts_hoje}`);

3. Listar Creators com Filtros:
   const creators = await api.userValidation.getAllUsers({
     status: 'em_analise',
     page: 1,
     per_page: 50
   });

4. Ver Documentos em Base64:
   const docs = await api.userValidation.getUserDocuments(1);
   console.log('Documento frente:', docs.documentos.documento_frente?.data);

5. Aprovar Creator:
   const result = await api.userValidation.updateUserStatus(1, 'aprovado');
   console.log(result.message);

6. Ativar/Desativar Creator:
   await api.userValidation.toggleUserActive(1, true);

7. Ver Relatórios Detalhados:
   const report = await api.reports.getCreatorsByStatus();
   const plansReport = await api.reports.getPlansReport();

8. Gerenciar Leilões:
   const auctions = await api.auctions.getAllAuctions();
   const pendingAuctions = await api.auctions.getPendingAuctions();
   await api.auctions.approveAuction(1);
   await api.auctions.rejectAuction(2);

9. Ver Posts com Imagens:
   const posts = await api.posts.getAllPosts({ page: 1, limit: 10 });
   const post = await api.posts.getPost(1); // com imagens base64

10. Informações do Sistema:
   const systemInfo = await api.system.getSystemInfo();
   const backup = await api.system.generateBackup();

ENDPOINTS IMPLEMENTADOS (17):
✅ POST /api/v1/admin/login
✅ GET /api/v1/admin/stats (calculado localmente)
✅ GET /api/v1/admin/creators
✅ GET /api/v1/admin/creators/{id}
✅ PUT /api/v1/admin/creators/{id}/status
✅ GET /api/v1/admin/creators/{id}/documentos
✅ PUT /api/v1/admin/creators/{id}/toggle-active
✅ GET /api/v1/admin/auctions (NOVO)
✅ PUT /api/v1/admin/auction/{id}/status (NOVO)
✅ GET /api/v1/admin/reports/creators-by-status
✅ GET /api/v1/admin/reports/planos
✅ GET /api/v1/admin/creators/{id}/planos
✅ GET /api/v1/admin/posts
✅ GET /api/v1/admin/posts/{id}
✅ DELETE /api/v1/admin/posts/{id}
✅ GET /api/v1/admin/system/info
✅ POST /api/v1/admin/system/backup
*/

// === UPGRADE/PERFIL API ===

export const upgradeAPI = {
  // Listar todas as solicitações de upgrade
  getAllUpgradeRequests: async (params?: {
    page?: number;
    per_page?: number;
    status_filter?: 'pendente' | 'aprovado' | 'rejeitado' | 'all';
  }): Promise<{
    requests: UpgradeRequest[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status_filter && params.status_filter !== 'all') {
      queryParams.append('status_filter', params.status_filter);
    }

    const query = queryParams.toString();
    const url = `${API_BASE_URL}/api/v1/admin/upgrades${query ? `?${query}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('📊 Solicitações de upgrade recebidas:', data);
    return data;
  },

  // Obter detalhes de uma solicitação específica
  getUpgradeRequest: async (upgradeId: number): Promise<UpgradeRequest> => {
    const url = `${API_BASE_URL}/api/v1/admin/upgrades/${upgradeId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`📊 Upgrade ${upgradeId} recebido:`, data);
    return data;
  },

  // Aprovar ou rejeitar solicitação de upgrade
  processUpgradeRequest: async (
    upgradeId: number, 
    approved: boolean, 
    rejectionReason?: string
  ): Promise<UpgradeApprovalResponse> => {
    const url = `${API_BASE_URL}/api/v1/admin/upgrades/${upgradeId}/process`;
    
    const requestBody: UpgradeApprovalRequest = {
      upgrade_id: upgradeId,
      approved,
      rejection_reason: rejectionReason,
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`✅ Upgrade ${upgradeId} processado:`, data);
    return data;
  },

  // Aprovar upgrade (método de conveniência)
  approveUpgrade: async (upgradeId: number): Promise<UpgradeApprovalResponse> => {
    return upgradeAPI.processUpgradeRequest(upgradeId, true);
  },

  // Rejeitar upgrade (método de conveniência)
  rejectUpgrade: async (upgradeId: number, reason: string): Promise<UpgradeApprovalResponse> => {
    return upgradeAPI.processUpgradeRequest(upgradeId, false, reason);
  },

  // Obter estatísticas de upgrades
  getUpgradeStats: async (): Promise<UpgradeStats> => {
    const allRequests = await upgradeAPI.getAllUpgradeRequests({ per_page: 1000 });
    
    const total_requests = allRequests.total;
    const pendentes = allRequests.requests.filter(r => r.status === 'pendente').length;
    const aprovados = allRequests.requests.filter(r => r.status === 'aprovado').length;
    const rejeitados = allRequests.requests.filter(r => r.status === 'rejeitado').length;

    return {
      total_requests,
      pendentes,
      aprovados,
      rejeitados,
    };
  },

  // Obter status detalhado de upgrade de criador com stages
  getCreatorUpgradeStatusDetailed: async (userId: number): Promise<CreatorUpgradeStatus> => {
    const url = `${API_BASE_URL}/api/v1/users/creator-upgrade-status-detalhado`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`📊 Status detalhado do upgrade:`, data);
    return data;
  },

  // Versão real da API quando o endpoint de admin estiver disponível
  getAllCreatorUpgradeStatusesReal: async (params?: {
    page?: number;
    per_page?: number;
    status_filter?: string;
  }): Promise<{
    upgrades: CreatorUpgradeStatus[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);

    const query = queryParams.toString();
    // TODO: Substituir por endpoint real quando disponível
    const url = `${API_BASE_URL}/api/v1/admin/creator-upgrade-status-detalhado${query ? `?${query}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('📊 Status de upgrades (admin - real):', data);
    return data;
  },

  // Listar todos os usuários com status detalhado de upgrade (para admin)
  getAllCreatorUpgradeStatuses: async (params?: {
    page?: number;
    per_page?: number;
    status_filter?: string;
  }): Promise<{
    upgrades: CreatorUpgradeStatus[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> => {
    // Por enquanto, vamos usar uma simulação de dados baseada na API real
    // Isso deve ser substituído quando o endpoint de admin estiver disponível
    
    console.log('⚠️ Usando dados simulados para upgrade status - aguardando endpoint de admin');
    
    // Simulação de dados baseados na estrutura real da API
    const mockData = {
      upgrades: [
        {
          id: 1,
          user_id: 123,
          status_geral: "Em Progresso (3/6) 🚀",
          progresso_percentage: 50,
          stage_atual: 4,
          stages: [
            {
              stage: 1,
              nome: "Dados Pessoais",
              concluido: true,
              data_conclusao: "2025-11-05T10:30:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 2,
              nome: "Perfil Criador",
              concluido: true,
              data_conclusao: "2025-11-05T11:15:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 3,
              nome: "Capa e Biografia",
              concluido: true,
              data_conclusao: "2025-11-05T12:00:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 4,
              nome: "Planos de Assinatura",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            },
            {
              stage: 5,
              nome: "Verificação de Identidade",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            },
            {
              stage: 6,
              nome: "Verificação de Email",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: true,
              observacoes: "Email cadastrado, aguardando verificação"
            }
          ],
          created_at: "2025-11-05T10:30:00",
          updated_at: "2025-11-05T12:00:00",
          approved_at: null,
          motivo_rejeicao: null,
          resumo_dados: {
            nome_completo: "João Silva Santos",
            cpf: "123.XXX.XXX-01",
            nickname: "@joaosilva",
            categoria: "Fitness",
            email_verificacao: "joao@email.com",
            tem_capa: true,
            tem_documentos: false,
            planos_cadastrados: 0
          }
        },
        {
          id: 2,
          user_id: 124,
          status_geral: "Aguardando Análise ⏳",
          progresso_percentage: 100,
          stage_atual: 7,
          stages: [
            {
              stage: 1,
              nome: "Dados Pessoais",
              concluido: true,
              data_conclusao: "2025-11-04T09:30:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 2,
              nome: "Perfil Criador",
              concluido: true,
              data_conclusao: "2025-11-04T10:15:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 3,
              nome: "Capa e Biografia",
              concluido: true,
              data_conclusao: "2025-11-04T11:00:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 4,
              nome: "Planos de Assinatura",
              concluido: true,
              data_conclusao: "2025-11-04T12:30:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 5,
              nome: "Verificação de Identidade",
              concluido: true,
              data_conclusao: "2025-11-04T13:00:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 6,
              nome: "Verificação de Email",
              concluido: true,
              data_conclusao: "2025-11-04T13:30:00",
              dados_preenchidos: true,
              observacoes: "Email verificado com sucesso"
            }
          ],
          created_at: "2025-11-04T09:30:00",
          updated_at: "2025-11-04T13:30:00",
          approved_at: null,
          motivo_rejeicao: null,
          resumo_dados: {
            nome_completo: "Maria Oliveira",
            cpf: "456.XXX.XXX-02",
            nickname: "@mariaoliveira",
            categoria: "Lifestyle",
            email_verificacao: "maria@email.com",
            tem_capa: true,
            tem_documentos: true,
            planos_cadastrados: 3
          }
        },
        {
          id: 3,
          user_id: 125,
          status_geral: "Em Progresso (1/6) 🚀",
          progresso_percentage: 16,
          stage_atual: 2,
          stages: [
            {
              stage: 1,
              nome: "Dados Pessoais",
              concluido: true,
              data_conclusao: "2025-11-05T14:30:00",
              dados_preenchidos: true,
              observacoes: null
            },
            {
              stage: 2,
              nome: "Perfil Criador",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            },
            {
              stage: 3,
              nome: "Capa e Biografia",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            },
            {
              stage: 4,
              nome: "Planos de Assinatura",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            },
            {
              stage: 5,
              nome: "Verificação de Identidade",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            },
            {
              stage: 6,
              nome: "Verificação de Email",
              concluido: false,
              data_conclusao: null,
              dados_preenchidos: false,
              observacoes: null
            }
          ],
          created_at: "2025-11-05T14:30:00",
          updated_at: "2025-11-05T14:30:00",
          approved_at: null,
          motivo_rejeicao: null,
          resumo_dados: {
            nome_completo: "Pedro Santos",
            cpf: "789.XXX.XXX-03",
            nickname: "@pedrosantos",
            categoria: "Gaming",
            email_verificacao: "pedro@email.com",
            tem_capa: false,
            tem_documentos: false,
            planos_cadastrados: 0
          }
        }
      ] as CreatorUpgradeStatus[],
      total: 3,
      page: params?.page || 1,
      per_page: params?.per_page || 50,
      total_pages: 1
    };

    // Filtrar por status se especificado
    if (params?.status_filter && params.status_filter !== "all") {
      const filtered = mockData.upgrades.filter(upgrade => {
        const status = upgrade.status_geral.toLowerCase();
        switch (params.status_filter) {
          case 'em_progresso':
            return status.includes('progresso');
          case 'aguardando_analise':
            return status.includes('aguardando');
          case 'em_analise':
            return status.includes('análise') && !status.includes('aguardando');
          case 'aprovado':
            return status.includes('aprovado');
          case 'rejeitado':
            return status.includes('rejeitado');
          default:
            return true;
        }
      });
      mockData.upgrades = filtered;
      mockData.total = filtered.length;
    }

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('📊 Status de upgrades (simulados):', mockData);
    return mockData;
  },
};

const api = {
  auth: authAPI,
  stats: statsAPI,
  loginValidation: loginValidationAPI,
  userValidation: userValidationAPI,
  creatorRegistration: creatorRegistrationAPI,
  auctions: auctionsAPI,
  posts: postsAPI,
  reports: reportsAPI,
  plans: plansAPI,
  system: systemAPI,
  upgrades: upgradeAPI,
  utils: apiUtils,
};

export default api;