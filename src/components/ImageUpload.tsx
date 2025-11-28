import React, { useState } from 'react';
import Image from 'next/image';
import { useCreatorRegistration } from '@/hooks/useCreatorRegistration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  tipoDocumento: 'documento_frente' | 'documento_verso' | 'selfie_documento';
  label: string;
  description: string;
  currentUser: any;
  onUploadSuccess?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  tipoDocumento,
  label,
  description,
  currentUser,
  onUploadSuccess
}) => {
  const { uploadDocument, isLoading, error, uploadProgress, isDocumentUploaded } = useCreatorRegistration();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isUploaded = isDocumentUploaded(tipoDocumento);
  const currentProgress = uploadProgress[tipoDocumento] || 0;

  const handleFileSelect = (file: File) => {
    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem (PNG, JPG, JPEG, WEBP, etc.)');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    const result = await uploadDocument(selectedFile, tipoDocumento);
    if (result && onUploadSuccess) {
      onUploadSuccess();
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {label}
          {isUploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Área de upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${isUploaded ? 'border-green-400 bg-green-50' : ''}
            cursor-pointer
          `}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative max-h-48 mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview da imagem selecionada"
                  className="max-h-48 mx-auto rounded border"
                />
              </div>
              <p className="text-sm text-gray-600">
                {selectedFile?.name} ({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          ) : isUploaded ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-green-600 font-medium">Imagem enviada com sucesso!</p>
              <p className="text-sm text-gray-600">Você pode enviar uma nova imagem se desejar substituir.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                Arraste uma imagem aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG ou WEBP (máx. 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Input de arquivo oculto */}
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id={`file-input-${tipoDocumento}`}
        />

        {/* Botões */}
        <div className="flex gap-2">
          {!selectedFile && !isUploaded && (
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(`file-input-${tipoDocumento}`)?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Imagem
            </Button>
          )}

          {selectedFile && !isUploaded && (
            <>
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? `Enviando... ${currentProgress}%` : 'Enviar Imagem'}
              </Button>
              <Button
                variant="outline"
                onClick={resetSelection}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </>
          )}

          {isUploaded && (
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(`file-input-${tipoDocumento}`)?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Substituir Imagem
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {isLoading && currentProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload;