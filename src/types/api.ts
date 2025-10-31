// Tipos para as respostas da API MediaPro

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  details?: any;
}

export interface LoginAttempt {
  id: string;
  user_id: string;
  email: string;
  username?: string;
  full_name?: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  device_info?: string;
  login_time: string;
  status: 'pending' | 'approved' | 'rejected';
  attempts_count: number;
  is_suspicious: boolean;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface LoginValidationRequest {
  login_attempt_id: string;
  action: 'approve' | 'reject';
  admin_notes?: string;
}

export interface PendingUser {
  id: number;
  nome_completo?: string; // Opcional para casos de dados incompletos
  nome_artistico?: string; // Opcional para casos de dados incompletos
  email: string; // Mantido obrigatório pois é sempre presente
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  status?: 'em_analise' | 'aprovado' | 'reprovado'; // Campo antigo (opcional)
  status_da_conta?: 'em_analise' | 'aprovado' | 'reprovado'; // Campo novo da API
  is_verified?: boolean; // Campo da nova API
  is_active?: boolean; // Campo da nova API
  motivo_reprovacao?: string;
  data_aprovacao?: string;
  created_at: string;
  updated_at?: string;
  aprovado_por?: number;
  // Imagens dos documentos em base64
  documento_frente?: string;
  documento_verso?: string;
  selfie_documento?: string;
  // Para compatibilidade com versão anterior
  documentos?: UserDocument[];
}

export interface UserDocument {
  id: number;
  tipo_documento: 'documento_frente' | 'documento_verso' | 'selfie_documento';
  nome_arquivo: string; // Backend retorna nome_arquivo
  tamanho_arquivo?: number; // Backend retorna tamanho_arquivo
  tipo_mime?: string;
  created_at: string;
  view_url?: string; // URL relativa para visualização
  download_url?: string; // URL relativa para download
  base64_data?: string; // Dados da imagem em base64
  
  // Campos alternativos para compatibilidade
  nome_imagem?: string;
  tamanho_imagem?: number; // Compatibilidade
}

export interface CreatorPost {
  id: number;
  creator_id: number;
  nome_completo?: string;
  nome_artistico?: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  total_images?: number;
  primeira_imagem?: string;
  imagem?: string; // Para posts únicos
  created_at: string;
  updated_at: string;
}

export interface PostImage {
  id: number;
  post_id: number;
  imagem: string; // Base64 data
  ordem: number;
  created_at: string;
}

export interface CreatePostRequest {
  titulo: string;
  descricao?: string;
  categoria?: string;
}

export interface CreateMultiplePostsRequest {
  posts: Array<{
    titulo: string;
    descricao?: string;
    categoria?: string;
    imagem: File;
  }>;
}

export interface AdminStats {
  total_usuarios: number;
  usuarios_em_analise: number;
  usuarios_aprovados: number;
  usuarios_reprovados: number;
  usuarios_hoje: number;
}

export interface ApprovalStats {
  em_analise: number;
  aprovado: number;
  rejeitado: number;
  total: number;
}

export interface UserApprovalRequest {
  user_id: number;
  approved: boolean;
  motivo_reprovacao?: string;
}

export interface UserApprovalResponse {
  success: boolean;
  message: string;
  user: PendingUser;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  profile_image?: string;
  tag_status: string;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface Admin {
  id: number;
  nome: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  admin: Admin;
  created_at: string;
  refresh_token?: string;
}

// === TIPOS PARA LEILÕES ===

export interface Auction {
  id: number;
  creator_id: number;
  creator_nome: string;
  creator_email: string;
  creator_nome_artistico: string;
  tipo_de_ensaio: string;
  titulo: string;
  descricao: string;
  preco_inicial: number;
  duracao_do_leilao: number;
  data_prevista: string;
  status: 'em_analise' | 'aprovado' | 'rejeitado';
  images_urls: string[];
  videos_urls: string[];
  total_images: number;
  total_videos: number;
  created_at: string;
  updated_at: string;
}

export interface AuctionStatusUpdate {
  status: 'aprovado' | 'rejeitado';
}

export interface AuctionStats {
  total_leiloes: number;
  em_analise: number;
  aprovados: number;
  rejeitados: number;
  valor_total_inicial: number;
}