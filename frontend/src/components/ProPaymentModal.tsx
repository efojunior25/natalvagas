import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Copy, ShieldCheck, Zap, ArrowRight, MessageCircle, Phone, UserCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface ProPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProPaymentModal: React.FC<ProPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, isAuthenticated, unlockProStatus } = useAuth();
  const [copiedType, setCopiedType] = useState<'payload' | 'phone' | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);

  // Contador de expiração de 15 minutos para o Pix
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Chave Pix Oficial (Telefone) do Edson / Natal Vagas
  const pixPhoneKey = '84992344922';
  const pixPhoneFormatted = '(84) 99234-4922';

  // Código Pix Copia e Cola (EMV Banco Central) com valor R$ 9,90 fixo
  const pixCopyPasteCode = '00020126360014br.gov.bcb.pix0114+558499234492252040000530398654049.905802BR5911NATAL VAGAS6005NATAL62070503***6304A77F';
  
  // Imagem do QR Code oficial gerada dinamicamente
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(pixCopyPasteCode)}`;

  const formatMinutes = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixCopyPasteCode);
    setCopiedType('payload');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(pixPhoneKey);
    setCopiedType('phone');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleConfirmPayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      unlockProStatus();
      setIsVerifying(false);
      onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-8">
          
          {/* Cabeçalho Pro */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso Imediato</span>
            </div>

            <h3 className="text-2xl font-black">Pacote Currículo Pro</h3>
            <p className="text-sm text-brand-100 mt-1">
              Destaque-se na pilha de candidatos das empresas de Natal e RN.
            </p>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">R$ 9,90</span>
                <span className="text-xs text-brand-200 uppercase font-semibold">Pagamento Único via Pix</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-300 font-mono bg-white/10 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>Expira em {formatMinutes(secondsLeft)}</span>
              </div>
            </div>
          </div>

          {/* Vínculo da Conta de Usuário */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Vinculado a: <strong>{user?.name}</strong> ({user?.email})</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-500">Quer salvar seu currículo na nuvem?</span>
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="text-brand-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Entrar com Google
                </button>
              </div>
            )}
          </div>

          {/* Benefícios inclusos */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>4 Modelos Visuais de Alto Padrão</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sem marca d'água no PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Carta de Apresentação Inclusa</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dicas de Palavras-chave por Cargo</span>
              </div>
            </div>

            {/* Área do Pix com QR Code Real */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center">
              
              <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-200 mb-3">
                <img 
                  src={qrCodeImageUrl} 
                  alt="QR Code Pix R$ 9,90 Natal Vagas" 
                  className="w-40 h-40 object-contain rounded-lg"
                />
                <span className="block text-[11px] font-bold text-slate-700 mt-1.5">
                  Escaneie com o app do seu Banco
                </span>
              </div>

              <div className="w-full space-y-2">
                {/* Botão Copiar Pix Copia e Cola */}
                <button
                  onClick={handleCopyPayload}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    copiedType === 'payload'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                  }`}
                >
                  {copiedType === 'payload' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Código Pix Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código Pix Copia e Cola (R$ 9,90)</span>
                    </>
                  )}
                </button>

                {/* Botão Copiar Chave Telefone Direta */}
                <button
                  onClick={handleCopyPhone}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    copiedType === 'phone'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {copiedType === 'phone' ? 'Chave Telefone Copiada!' : `Ou copie a chave Telefone: ${pixPhoneFormatted}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Botão de liberação */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={handleConfirmPayment}
                disabled={isVerifying}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>{isVerifying ? 'Verificando Pagamento...' : 'Já fiz o Pix, Liberar Recursos Pro'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Pagamento seguro via Pix
                </span>
                <a 
                  href="https://wa.me/5584992344922?text=Ol%C3%A1%2C+acabei+de+fazer+o+Pix+do+Pacote+Pro+no+Natal+Vagas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Suporte WhatsApp
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modal de Autenticação se o usuário desejar entrar */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Conectar com o Google"
        subtitle="Vincule sua conta para manter seus currículos salvos para sempre."
      />
    </>
  );
};
export default ProPaymentModal;
