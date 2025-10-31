import { useState, useCallback } from 'react';
import { creatorRegistrationAPI } from '@/lib/api';
import { PendingUser, UserDocument } from '@/types/api';

interface UserRegistrationData {
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
}

interface UseCreatorRegistrationReturn {
  // Estados
  currentUser: PendingUser | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: { [key: string]: number };
  
  // Ações
  createUser: (userData: UserRegistrationData) => Promise<PendingUser | null>;
  uploadDocument: (file: File, tipoDocumento: 'documento_frente' | 'documento_verso' | 'selfie_documento') => Promise<UserDocument | null>;
  submitForReview: () => Promise<boolean>;
  reset: () => void;
  
  // Utilitários
  isDocumentUploaded: (tipo: 'documento_frente' | 'documento_verso' | 'selfie_documento') => boolean;
  canSubmitForReview: () => boolean;
}

export const useCreatorRegistration = (): UseCreatorRegistrationReturn => {
  const [currentUser, setCurrentUser] = useState<PendingUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Criar usuário
  const createUser = useCallback(async (userData: UserRegistrationData): Promise<PendingUser | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await creatorRegistrationAPI.createUser(userData);
      setCurrentUser(response.user);
      return response.user;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar usuário';
      setError(errorMessage);
      console.error('Erro ao criar usuário:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload de imagem de documento
  const uploadDocument = useCallback(async (
    imageFile: File, 
    tipoDocumento: 'documento_frente' | 'documento_verso' | 'selfie_documento'
  ): Promise<UserDocument | null> => {
    if (!currentUser) {
      setError('Usuário não encontrado. Crie o perfil primeiro.');
      return null;
    }

    // Validar se é uma imagem
    if (!imageFile.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, WEBP, etc.)');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(prev => ({ ...prev, [tipoDocumento]: 0 }));

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [tipoDocumento]: Math.min((prev[tipoDocumento] || 0) + 20, 90)
        }));
      }, 200);

      const response = await creatorRegistrationAPI.uploadDocument(currentUser.id, imageFile, tipoDocumento);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [tipoDocumento]: 100 }));

      // Atualizar o usuário atual com o novo documento
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        
        const updatedDocuments = [...(prevUser.documentos || [])];
        const existingIndex = updatedDocuments.findIndex(doc => doc.tipo_documento === tipoDocumento);
        
        if (existingIndex >= 0) {
          updatedDocuments[existingIndex] = response.document;
        } else {
          updatedDocuments.push(response.document);
        }

        return {
          ...prevUser,
          documentos: updatedDocuments
        };
      });

      // Limpar progresso após 2 segundos
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tipoDocumento];
          return newProgress;
        });
      }, 2000);

      return response.document;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer upload da imagem';
      setError(errorMessage);
      console.error(`Erro no upload da imagem ${tipoDocumento}:`, err);
      
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[tipoDocumento];
        return newProgress;
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Verificar se pode enviar para análise
  const canSubmitForReview = useCallback((): boolean => {
    if (!currentUser) return false;
    
    const requiredDocuments: ('documento_frente' | 'documento_verso' | 'selfie_documento')[] = [
      'documento_frente',
      'documento_verso', 
      'selfie_documento'
    ];
    
    return requiredDocuments.every(tipo => 
      currentUser.documentos?.some(doc => doc.tipo_documento === tipo) || false
    );
  }, [currentUser]);

  // Enviar para análise
  const submitForReview = useCallback(async (): Promise<boolean> => {
    if (!currentUser) {
      setError('Usuário não encontrado');
      return false;
    }

    if (!canSubmitForReview()) {
      setError('Todas as imagens de documentos devem ser enviadas antes de submeter para análise');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await creatorRegistrationAPI.submitForReview(currentUser.id);
      setCurrentUser(response.user);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao enviar para análise';
      setError(errorMessage);
      console.error('Erro ao enviar para análise:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, canSubmitForReview]);

  // Reset do estado
  const reset = useCallback(() => {
    setCurrentUser(null);
    setIsLoading(false);
    setError(null);
    setUploadProgress({});
  }, []);

  // Verificar se um documento específico foi enviado
  const isDocumentUploaded = useCallback((tipo: 'documento_frente' | 'documento_verso' | 'selfie_documento'): boolean => {
    if (!currentUser) return false;
    return currentUser.documentos?.some(doc => doc.tipo_documento === tipo) || false;
  }, [currentUser]);

  return {
    // Estados
    currentUser,
    isLoading,
    error,
    uploadProgress,
    
    // Ações
    createUser,
    uploadDocument,
    submitForReview,
    reset,
    
    // Utilitários
    isDocumentUploaded,
    canSubmitForReview,
  };
};