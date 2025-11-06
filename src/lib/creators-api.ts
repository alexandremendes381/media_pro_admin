import { 
  Creator, 
  CreatorStatusUpdate, 
  CreatorStats,
  CreatorUpgradeRequest,
  CreatorUpgradeRequestDetails,
  CreatorUpgradeRequestsResponse,
  UpgradeStatusUpdate
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

// Função para configurar headers de autenticação
const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// === CREATOR MANAGEMENT API ===

export const creatorsAPI = {
  // GET /api/v1/admin/creators - Listar todos os creators
  getAllCreators: async (params?: {
    status_filter?: 'em_analise' | 'aprovado' | 'reprovado';
    skip?: number;
    limit?: number;
  }): Promise<Creator[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/api/v1/admin/creators${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar creators: ${response.statusText}`);
    }
    
    return response.json();
  },

  // GET /api/v1/admin/creators/{creator_id} - Obter creator específico
  getCreatorById: async (creatorId: number): Promise<Creator> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/creators/${creatorId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar creator ${creatorId}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // PUT /api/v1/admin/creators/{creator_id}/status - Atualizar status do creator
  updateCreatorStatus: async (creatorId: number, data: CreatorStatusUpdate) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/creators/${creatorId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status do creator: ${response.statusText}`);
    }
    
    return response.json();
  },

  // GET /api/v1/admin/creators/search - Buscar creators
  searchCreators: async (params: {
    q?: string;
    status?: string;
    cidade?: string;
    estado?: string;
    verified_only?: boolean;
    date_from?: string;
    date_to?: string;
    skip?: number;
    limit?: number;
  }): Promise<Creator[]> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/creators/search?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro na busca de creators: ${response.statusText}`);
    }
    
    return response.json();
  },

  // GET /api/v1/admin/creators/stats - Estatísticas dos creators
  getCreatorStats: async (): Promise<CreatorStats> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/creators/stats`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar estatísticas: ${response.statusText}`);
    }
    
    return response.json();
  },

  // ...apenas funções reais da API admin...
};

// === CREATOR UPGRADE REQUESTS API ===

export const upgradeRequestsAPI = {
  // GET /api/v1/admin/creator-upgrade-requests - Listar solicitações de upgrade
  getAllCreatorUpgradeRequests: async (params?: {
    status_filter?: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
    skip?: number;
    limit?: number;
  }): Promise<CreatorUpgradeRequest[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/api/v1/admin/creator-upgrade-requests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar solicitações de upgrade: ${response.statusText}`);
    }
    
    return response.json();
  },

  // GET /api/v1/admin/creator-upgrade-requests/{request_id} - Obter detalhes de uma solicitação
  getCreatorUpgradeRequestDetails: async (requestId: number): Promise<CreatorUpgradeRequestDetails> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/creator-upgrade-requests/${requestId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes da solicitação ${requestId}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // PUT /api/v1/admin/creator-upgrade-requests/{request_id}/status - Aprovar/Rejeitar solicitação
  updateUpgradeRequestStatus: async (requestId: number, data: UpgradeStatusUpdate) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/creator-upgrade-requests/${requestId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status da solicitação: ${response.statusText}`);
    }
    
    return response.json();
  },

  // ...apenas funções reais da API admin...
};

// Objeto agregado para exportar todas as APIs relacionadas a creators
const creatorsManagementAPI = {
  creators: creatorsAPI,
  upgradeRequests: upgradeRequestsAPI
};

export default creatorsManagementAPI;