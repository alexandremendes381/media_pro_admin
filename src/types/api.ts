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
  // IDs e identificadores
  id: number;
  request_id?: number;
  user_id?: number;
  
  // Dados do usuário
  nome_completo?: string;
  nome_artistico?: string;
  email: string;
  user_email?: string;
  user_nickname?: string;
  user_nome?: string;
  user_type?: string;
  
  // Status e controle
  status?: 'em_analise' | 'aprovado' | 'reprovado'; // Campo antigo (opcional)
  status_da_conta?: 'em_analise' | 'aprovado' | 'reprovado'; // Campo novo da API
  upgrade_status?: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
  is_verified?: boolean;
  is_active?: boolean;
  motivo_reprovacao?: string;
  motivo_rejeicao?: string;
  data_aprovacao?: string;
  approved_at?: string;
  aprovado_por?: number;
  
  // Dados pessoais do creator
  cpf?: string;
  data_nascimento?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  
  // Perfil do creator
  nome_perfil?: string;
  mediapro_username?: string;
  biografia?: string;
  
  // Planos e valores
  plano_mensal_ativo?: boolean;
  plano_mensal_valor?: number;
  plano_trimestral_ativo?: boolean;
  plano_trimestral_valor?: number;
  plano_semestral_ativo?: boolean;
  plano_semestral_valor?: number;
  
  // Verificação de email
  email_verificacao?: string;
  email_verificado?: boolean;
  codigo_verificacao?: string;
  codigo_expira_em?: string;
  
  // Tipos de imagens (apenas tipo, não dados)
  image_perfil_tipo?: string;
  image_capa_tipo?: string;
  foto_documento_tipo?: string;
  selfie_rosto_tipo?: string;
  
  // Datas
  created_at: string;
  updated_at?: string;
  
  // Imagens dos documentos em base64 (compatibilidade)
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

// Tipos para validação por passos
export interface CreatorStep {
  step: number;
  nome: string;
  completo: boolean;
  status_validacao: 'aguardando' | 'aprovado' | 'reprovado';
  dados: any;
}

export interface CreatorStepsResponse {
  request_id: number;
  user_id: number;
  user_email: string;
  user_nickname: string;
  status_geral: 'em_analise' | 'aprovado' | 'rejeitado';
  progresso_percentage: number;
  passos_completos: number;
  total_passos: number;
  passos: CreatorStep[];
  timestamps: {
    created_at: string;
    updated_at: string;
    approved_at: string | null;
  };
}

export interface StepValidationRequest {
  aprovado: boolean;
  observacoes?: string;
  motivo_rejeicao?: string;
}

export interface StepValidationResponse {
  message: string;
  request_id: number;
  step_number: number;
  step_name: string;
  aprovado: boolean;
  observacoes: string | null;
  motivo_rejeicao: string | null;
  status_geral: 'em_analise' | 'aprovado' | 'rejeitado';
  validated_by_admin: string;
  validated_at: string;
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
  lance_minimo: number;
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

export interface CreateAuctionRequest {
  creator_id: number;
  tipo_de_ensaio: string;
  titulo: string;
  descricao: string;
  preco_inicial: number;
  lance_minimo: number;
  duracao_do_leilao: number; // em horas
  data_prevista: string; // ISO string
  images?: File[];
  videos?: File[];
}

export interface CreateAuctionResponse {
  success: boolean;
  message: string;
  auction: Auction;
}

export interface AuctionStats {
  total_leiloes: number;
  em_analise: number;
  aprovados: number;
  rejeitados: number;
  valor_total_inicial: number;
}

// === TIPOS PARA UPGRADE/PERFIL ===

export interface UserProfile {
  id: number;
  user_id: number;
  image_perfil?: string;
  nome_perfil: string;
  mediaPro_username: string;
  email: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  created_at: string;
  updated_at: string;
  approved_by?: number;
  rejection_reason?: string;
}

export interface UpgradeRequest {
  id: number;
  user_id: number;
  profile_data: {
    image_perfil?: string;
    nome_perfil: string;
    mediaPro_username: string;
  };
  user_email: string;
  user_nome_completo: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  requested_at: string;
  processed_at?: string;
  processed_by?: number;
  rejection_reason?: string;
}

export interface UpgradeApprovalRequest {
  upgrade_id: number;
  approved: boolean;
  rejection_reason?: string;
}

export interface UpgradeApprovalResponse {
  success: boolean;
  message: string;
  upgrade: UpgradeRequest;
}

export interface UpgradeStats {
  total_requests: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
}

// === TIPOS PARA CREATORS ===

export interface Creator {
  id: number;
  nome_completo: string;
  nome_artistico: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  status_da_conta: 'em_analise' | 'aprovado' | 'reprovado';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  documento_frente?: string;
  documento_verso?: string;
  selfie_documento?: string;
}

export interface CreatorStatusUpdate {
  status: 'em_analise' | 'aprovado' | 'reprovado';
  motivo?: string;
}

// === TIPOS PARA UPGRADE/CREATOR REQUESTS ===

export interface CreatorUpgradeRequest {
  id: number;
  user_id: number;
  user_email: string;
  user_nickname: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  pais: string;
  nickname: string;
  categoria: string;
  email_verificacao: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'cancelado';
  progresso_percentage: number;
  stages_concluidos: number;
  perfil_configurado: boolean;
  capa_configurada: boolean;
  planos_configurados: boolean;
  documentos_enviados: boolean;
  email_verificado: boolean;
  motivo_rejeicao?: string | null;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
}

export interface UpgradeStageData {
  stage: number;
  nome: string;
  concluido: boolean;
  dados: any; // Dados específicos de cada stage
}

export interface CreatorUpgradeRequestDetails {
  id: number;
  user_id: number;
  user_data: {
    email: string;
    nickname: string;
    user_type: string;
    created_at: string;
  };
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado' | 'cancelado';
  motivo_rejeicao?: string | null;
  stages: UpgradeStageData[];
  documentos: {
    foto_documento_base64?: string;
    foto_documento_tipo?: string;
    selfie_rosto_base64?: string;
    selfie_rosto_tipo?: string;
    capa_base64?: string;
    capa_tipo?: string;
  };
  timestamps: {
    created_at: string;
    updated_at: string;
    approved_at?: string | null;
    email_verificado_em?: string | null;
  };
}

export interface CreatorUpgradeRequestsResponse {
  requests: CreatorUpgradeRequest[];
  total_count: number;
  page_info: {
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface UpgradeStatusUpdate {
  status: 'aprovado' | 'rejeitado';
  observacoes?: string;
  motivo_rejeicao?: string;
}

export interface CreatorStats {
  creators_totais: number;
  creators_ativos: number;
  creators_verificados: number;
  por_status: {
    em_analise: number;
    aprovado: number;
    reprovado: number;
  };
  solicitacoes_upgrade: {
    pendentes: number;
    em_analise: number;
    aprovadas_mes: number;
    rejeitadas_mes: number;
  };
  crescimento_mensal: {
    novos_creators: number;
    percentual_crescimento: number;
  };
  top_estados: Array<{
    estado: string;
    total: number;
  }>;
}

// === TIPOS PARA TRANSFERIR MEDIACOINS ===

export interface ExpiredAuction {
  auction_id: number;
  titulo: string;
  descricao: string;
  tipo_de_ensaio: string;
  created_at: string;
  data_prevista: string;
  data_termino: string;
  expired_hours_ago: number;
  status: 'expirado';
  can_be_finalized: boolean;
  requires_manual_action: boolean;
  has_winner: boolean;
  creator: {
    creator_id: number;
    creator_name: string;
    creator_nome_completo: string;
    creator_email: string;
    creator_status: string;
    creator_verified: boolean;
  };
  creator_balance: {
    current_balance: number;
    balance_after_receiving: number;
  };
  financial: {
    initial_price: number;
    minimum_bid: number;
    highest_bid: number | null;
    winning_bid: number | null;
    total_bids: number;
    needs_transfer: number | null;
  };
  media_info: {
    total_images: number;
    total_videos: number;
  };
  winner: {
    user_id: number;
    user_name: string;
    bid_value: number;
    bid_created_at: string;
  } | null;
  winner_balance: {
    current_balance: number;
    balance_after_payment: number;
  } | null;
  requested_by: string;
  timestamp: string;
}

export interface ExpiredAuctionsResponse {
  auctions: ExpiredAuction[];
  summary: {
    total_with_winner: number;
    total_without_winner: number;
    total_value_to_transfer: number;
  };
  total_expired_auctions: number;
}

export interface FinalizeAuctionRequest {
  observacoes?: string;
}

export interface FinalizeAuctionResponse {
  success: boolean;
  message: string;
  auction_id: number;
  status: 'finalizado' | 'finalizado_sem_lances';
  
  // Winner info (null se não houve lances)
  winner?: {
    user_id: number;
    user_name: string;
    bid_value: number;
  } | null;
  
  // Creator info sempre presente
  creator: {
    creator_id: number;
    creator_name?: string;
    balance_before?: number;
    balance_after?: number;
    received: number; // 0 se não houve transferência
  };
  
  // Transaction info (apenas se houve transferência)
  transactions?: {
    user_transaction_id: number;
    creator_transaction_id: number;
  };
  
  finalized_by: string;
  finalized_at: string;

  // Campos da interface antiga (para compatibilidade)
  id?: number;
  titulo?: string;
  mediacoins_transferidos?: number;
  vencedor?: {
    id: number;
    nickname: string;
    email: string;
  };
  midia_liberada?: boolean;
  data_finalizacao?: string;
  observacoes?: string;
}

// Interface para status detalhado de upgrade de creator (com stages)
export interface CreatorUpgradeStatus {
  id: number;
  user_id: number;
  status_geral: string;
  progresso_percentage: number;
  stage_atual: number;
  stages: Array<{
    stage: number;
    nome: string;
    concluido: boolean;
    data_conclusao: string | null;
    dados_preenchidos: boolean;
    observacoes: string | null;
  }>;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  motivo_rejeicao: string | null;
  resumo_dados: {
    nome_completo: string;
    cpf: string;
    nickname: string;
    categoria: string;
    email_verificacao: string;
    tem_capa: boolean;
    tem_documentos: boolean;
    planos_cadastrados: number;
  };
}