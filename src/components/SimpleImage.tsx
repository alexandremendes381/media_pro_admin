'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { userValidationAPI } from '@/lib/api';

interface SimpleImageProps {
  userId?: number;
  documentId?: number;
  documentType?: string;
  viewUrl?: string;
  base64Data?: string; // Novo campo para imagens base64
  src?: string; // Suporte para src direto (compatibilidade)
  alt?: string;
  className?: string;
}

export default function SimpleImage({ 
  userId, 
  documentId, 
  documentType = 'image', 
  viewUrl,
  base64Data,
  src,
  alt, 
  className = ""
}: SimpleImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      console.log(`🖼️ SimpleImage iniciando para ${documentType}`, { base64Data: !!base64Data, src: !!src, documentId, userId });
      
      // Se temos src direto, usar diretamente (compatibilidade)
      if (src) {
        console.log(`✅ Usando src direto: ${src.substring(0, 100)}...`);
        setImageSrc(src);
        setLoading(false);
        setError(false);
        return;
      }
      
      // Se temos dados base64, usar diretamente
      if (base64Data) {
        console.log(`✅ Usando imagem base64 para documento ${documentType} (${base64Data.length} chars)`);
        console.log(`📊 Base64 preview: ${base64Data.substring(0, 100)}...`);
        
        // Verificar se é uma imagem válida
        if (base64Data.startsWith('data:image/')) {
          setImageSrc(base64Data);
          setLoading(false);
          setError(false);
          return;
        } else {
          console.warn(`⚠️ Base64 inválido para ${documentType} - não começa com data:image/`);
        }
      }

      // Caso contrário, tentar carregar via API (método antigo)
      if (documentId) {
        console.log(`🖼️ Tentando carregar imagem para documento ${documentId}`);
        
        // URL pública (mais simples e direta)
        const publicUrl = userValidationAPI.getPublicDocumentViewURL(documentId);
        console.log(`🔗 Testando URL pública: ${publicUrl}`);
        
        // Testar carregamento da imagem
        const testImg = document.createElement('img');
        testImg.onload = () => {
          console.log(`✅ Imagem carregou com sucesso: ${publicUrl}`);
          setImageSrc(publicUrl);
          setLoading(false);
          setError(false);
        };
        testImg.onerror = () => {
          console.log(`❌ Erro ao carregar imagem: ${publicUrl}`);
          setError(true);
          setLoading(false);
        };
        testImg.src = publicUrl;
      } else {
        setError(true);
        setLoading(false);
      }
    };

    loadImage();
  }, [documentId, base64Data, src, documentType, userId]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-center text-gray-500">
          <div className="mb-2">❌</div>
          <p className="text-sm">Erro ao carregar imagem</p>
          <p className="text-xs">{documentType}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '200px', width: 'auto', height: 'auto' }}>
      <Image 
        src={imageSrc} 
        alt={alt || `Documento ${documentType}`}
        width={800}
        height={600}
        className="w-full h-auto max-h-96 object-contain rounded-lg"
        style={{ minHeight: '200px' }}
        unoptimized={true} // Necessário para imagens base64
      />
    </div>
  );
}