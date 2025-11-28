"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreatorImage from "@/components/CreatorImage";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  CreditCard,
  Camera,
  Shield,
  FileCheck
} from "lucide-react";
import { CreatorStep } from "@/types/api";

interface StepValidationProps {
  step: CreatorStep;
  requestId: number;
  onValidate: (stepNumber: number, approved: boolean, observations?: string, rejectionReason?: string) => void;
  isLoading?: boolean;
}

const StepValidation: React.FC<StepValidationProps> = ({
  step,
  requestId,
  onValidate,
  isLoading = false
}) => {
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState<'approve' | 'reject' | null>(null);

  const getStepIcon = (stepNumber: number) => {
    const icons = {
      1: User,
      2: User,
      3: Camera,
      4: CreditCard,
      5: Shield,
      6: Mail
    };
    return icons[stepNumber as keyof typeof icons] || FileCheck;
  };

  const getStepColor = (step: CreatorStep) => {
    if (step.status_validacao === 'aprovado') {
      return "text-green-700 bg-green-50 border-green-300 shadow-sm";
    } else if (step.status_validacao === 'reprovado') {
      return "text-red-700 bg-red-50 border-red-300 shadow-sm";
    } else if (step.completo) {
      return "text-blue-700 bg-blue-50 border-blue-300 shadow-sm";
    } else {
      return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStepStatus = (step: CreatorStep) => {
    if (step.status_validacao === 'aprovado') {
      return { variant: "default" as const, icon: CheckCircle, label: "✅ Aprovado" };
    } else if (step.status_validacao === 'reprovado') {
      return { variant: "destructive" as const, icon: XCircle, label: "❌ Reprovado" };
    } else if (step.completo) {
      return { variant: "secondary" as const, icon: Clock, label: "⏳ Aguardando Validação" };
    } else {
      return { variant: "outline" as const, icon: Clock, label: "⚠️ Incompleto" };
    }
  };

  const renderStepData = () => {
    switch (step.step) {
      case 1: // Região e Identificação
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Nome Completo:</span>
              <p className="text-muted-foreground">{step.dados.nome_completo}</p>
            </div>
            <div>
              <span className="font-medium">CPF:</span>
              <p className="text-muted-foreground">{step.dados.cpf}</p>
            </div>
            <div>
              <span className="font-medium">Data de Nascimento:</span>
              <p className="text-muted-foreground">{step.dados.data_nascimento}</p>
            </div>
            <div>
              <span className="font-medium">País:</span>
              <p className="text-muted-foreground">{step.dados.pais}</p>
            </div>
            <div>
              <span className="font-medium">estado:</span>
              <p className="text-muted-foreground">{step.dados.estado}</p>
            </div>
            <div>
              <span className="font-medium">cidade:</span>
              <p className="text-muted-foreground">{step.dados.cidade}</p>
            </div>
          </div>
        );

      case 2: // Perfil Creator
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Nome do Perfil:</span>
                <p className="text-muted-foreground">{step.dados.nome_perfil}</p>
              </div>
             
              <div>
                <span className="font-medium">instagram:</span>
                <p className="text-muted-foreground">{step.dados.instagram || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">X:</span>
                <p className="text-muted-foreground">{step.dados.twitter || "N/A"}</p>
              </div>
                            <div>
                <span className="font-medium">Youtube:</span>
                <p className="text-muted-foreground">{step.dados.youtube || "N/A"}</p>
              </div>
            </div>
            {step.dados.tem_image_perfil && (
              <div>
                <span className="font-medium block mb-2">Imagem de Perfil:</span>
                <CreatorImage
                  requestId={requestId}
                  imageType="image_perfil"
                  alt="Foto de perfil"
                  label=""
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        );

      case 3: // Capa e Biografia
        return (
          <div className="space-y-4">
            <div>
              <span className="font-medium">Biografia:</span>
              <p className="text-muted-foreground bg-gray-50 p-3 rounded">{step.dados.biografia}</p>
            </div>
            {step.dados.tem_image_capa && (
              <div>
                <span className="font-medium block mb-2">Imagem de Capa:</span>
                <CreatorImage
                  requestId={requestId}
                  imageType="image_capa"
                  alt="Foto de capa"
                  label=""
                  className="w-48 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        );

      case 4: // Planos de Assinatura
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {step.dados.plano_mensal_ativo && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800">Plano Mensal</h4>
                <p className="text-2xl font-bold text-blue-600">R$ {step.dados.plano_mensal_valor}</p>
                <Badge className="bg-blue-100 text-blue-800">Ativo</Badge>
              </div>
            )}
            {step.dados.plano_trimestral_ativo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800">Plano Trimestral</h4>
                <p className="text-2xl font-bold text-green-600">R$ {step.dados.plano_trimestral_valor}</p>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
            )}
            {step.dados.plano_semestral_ativo && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800">Plano Semestral</h4>
                <p className="text-2xl font-bold text-purple-600">R$ {step.dados.plano_semestral_valor}</p>
                <Badge className="bg-purple-100 text-purple-800">Ativo</Badge>
              </div>
            )}
          </div>
        );

      case 5: // Verificação de Identidade
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {step.dados.tem_foto_documento && (
                <div>
                  <span className="font-medium block mb-2">Documento de Identidade:</span>
                  <CreatorImage
                    requestId={requestId}
                    imageType="foto_documento"
                    alt="Documento de identidade"
                    label=""
                    className="w-40 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
              {step.dados.tem_selfie_rosto && (
                <div>
                  <span className="font-medium block mb-2">Selfie com Documento:</span>
                  <CreatorImage
                    requestId={requestId}
                    imageType="selfie_rosto"
                    alt="Selfie com documento"
                    label=""
                    className="w-40 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Verificação de Email
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Email para Verificação:</span>
              <p className="text-muted-foreground">{step.dados.email_verificacao}</p>
            </div>
            <div>
              <span className="font-medium">Status da Verificação:</span>
              <p className={`font-medium ${step.dados.email_verificado ? 'text-green-600' : 'text-red-600'}`}>
                {step.dados.email_verificado ? 'Verificado ✓' : 'Não Verificado ✗'}
              </p>
            </div>
            {step.dados.codigo_verificacao && (
              <div>
                <span className="font-medium">Código de Verificação:</span>
                <p className="text-muted-foreground font-mono">{step.dados.codigo_verificacao}</p>
              </div>
            )}
            {step.dados.codigo_expira_em && (
              <div>
                <span className="font-medium">Código Expira em:</span>
                <p className="text-muted-foreground">{new Date(step.dados.codigo_expira_em).toLocaleString()}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-muted-foreground">
            Dados não disponíveis para este passo.
          </div>
        );
    }
  };

  const IconComponent = getStepIcon(step.step);

  const statusInfo = getStepStatus(step);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={`transition-all ${getStepColor(step)}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step.status_validacao === 'aprovado' ? 'bg-green-100 text-green-600' :
                step.status_validacao === 'reprovado' ? 'bg-red-100 text-red-600' :
                  step.completo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Passo {step.step}: {step.nome}</h3>
              <Badge variant={statusInfo.variant}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Só mostrar botões se ainda não foi validado */}
          {step.status_validacao === 'aguardando' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  toast.info(`Aprovando passo ${step.step}: ${step.nome}...`);
                  onValidate(step.step, true, 'Aprovado diretamente pelo admin');
                }}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setValidationType('reject');
                  setShowValidationModal(true);
                }}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reprovar
              </Button>
            </div>
          )}

          {/* Mostrar status final se já foi validado */}
          {step.status_validacao !== 'aguardando' && (
            <div className="text-sm text-muted-foreground">
              {step.status_validacao === 'aprovado' ? (
                <span className="text-green-600 font-medium">✅ Já Aprovado</span>
              ) : (
                <span className="text-red-600 font-medium">❌ Já Reprovado</span>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Mostrar motivo da reprovação se existir */}
        {step.status_validacao === 'reprovado' && step.dados?.motivo_rejeicao && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-1">Motivo da Reprovação:</h4>
            <p className="text-red-700 text-sm">{step.dados.motivo_rejeicao}</p>
          </div>
        )}

        {/* Mostrar observações da aprovação se existir */}
        {step.status_validacao === 'aprovado' && step.dados?.observacoes && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">Observações:</h4>
            <p className="text-green-700 text-sm">{step.dados.observacoes}</p>
          </div>
        )}

        {renderStepData()}
      </CardContent>

      {/* Modal de Validação - só aparece se o passo ainda não foi validado */}
      {showValidationModal && step.status_validacao === 'aguardando' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {validationType === 'approve' ? 'Aprovar' : 'Reprovar'} Passo {step.step}
            </h3>
            <p className="text-muted-foreground mb-4">
              {validationType === 'approve'
                ? 'Tem certeza que deseja aprovar este passo?'
                : 'Informe o motivo da reprovação:'}
            </p>

            {validationType === 'reject' && (
              <textarea
                id="rejection-reason"
                className="w-full p-2 border rounded mb-4"
                rows={3}
                placeholder="Motivo da reprovação..."
              />
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowValidationModal(false);
                  setValidationType(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const isApproved = validationType === 'approve';
                  const reason = validationType === 'reject'
                    ? (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value
                    : undefined;

                  // Mostrar toast informativo antes de processar
                  if (isApproved) {
                    toast.info(`Aprovando passo ${step.step}: ${step.nome}...`);
                  } else {
                    toast.info(`Reprovando passo ${step.step}: ${step.nome}...`);
                  }

                  onValidate(step.step, isApproved, undefined, reason);
                  setShowValidationModal(false);
                  setValidationType(null);
                }}
                className={validationType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={validationType === 'approve' ? 'default' : 'destructive'}
              >
                {validationType === 'approve' ? 'Aprovar' : 'Reprovar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StepValidation;