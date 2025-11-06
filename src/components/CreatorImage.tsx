"use client";

import { useState, useEffect, useRef } from 'react';

interface CreatorImageProps {
  requestId: number;
  imageType: 'image_perfil' | 'image_capa' | 'foto_documento' | 'selfie_rosto';
  alt: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

// Cache simples para evitar requests repetidos
const imageCache = new Map<string, string>();

const CreatorImage: React.FC<CreatorImageProps> = ({
  requestId,
  imageType,
  alt,
  label,
  className = "w-20 h-20 object-cover rounded border",
  style = {}
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mountedRef = useRef(true);

  // Garantir que estamos no cliente para evitar problemas de hidratação
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Obter token de autenticação
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  // Carregar imagem com autenticação
  useEffect(() => {
    if (!isClient) return;
    mountedRef.current = true;
    
    const cacheKey = `${requestId}-${imageType}`;
    
    // Verificar se já está no cache
    if (imageCache.has(cacheKey)) {
      const cachedUrl = imageCache.get(cacheKey);
      if (cachedUrl && mountedRef.current) {
        setImageSrc(cachedUrl);
        setLoading(false);
        setError(false);
        return;
      }
    }
    
    const loadImage = async () => {
      try {
        if (!mountedRef.current) return;
        
        setLoading(true);
        setError(false);

        const token = getAuthToken();
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        const imageUrl = `http://localhost:8000/api/v1/admin/creators/${requestId}/${imageType}`;
        
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Salvar no cache e atualizar estado se ainda montado
        if (mountedRef.current) {
          imageCache.set(cacheKey, objectUrl);
          setImageSrc(objectUrl);
        } else {
          // Se não está montado, limpar a URL criada
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        if (mountedRef.current) {
          console.warn(`Erro ao carregar ${imageType} para request_id ${requestId}:`, err);
          setError(true);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [requestId, imageType, isClient]);

  if (!isClient || loading) {
    return (
      <div>
        <span className="text-xs block mb-1">{label}</span>
        <div className={`${className} flex items-center justify-center bg-gray-100`} style={style}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div>
        <span className="text-xs block mb-1">{label}</span>
        <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 text-xs`} style={style}>
          <span>Sem imagem</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-xs block mb-1">{label}</span>
      <img
        src={imageSrc}
        alt={alt}
        className={className + " cursor-pointer"}
        style={style}
        onClick={() => setShowModal(true)}
        onError={() => {
          console.warn(`Erro ao exibir ${imageType} para request_id ${requestId}`);
          setError(true);
        }}
      />

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-4 flex flex-col items-center"
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-700 hover:text-red-600 text-xl font-bold"
              onClick={() => setShowModal(false)}
              aria-label="Fechar"
            >
              &times;
            </button>
            <img
              src={imageSrc}
              alt={alt}
              style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: '8px' }}
              className="shadow-lg"
            />
            <span className="mt-2 text-sm text-muted-foreground">Clique fora ou no X para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorImage;