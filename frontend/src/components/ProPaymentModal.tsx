import React, { useState } from 'react';
import { X, Sparkles, Check, Copy, QrCode, ShieldCheck, Zap, ArrowRight, MessageCircle } from 'lucide-react';

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
  const [copied, setCopied] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  // Código Pix Copia e Cola configurado (pode ser chave direta ou payload Mercado Pago / Asaas)
  const pixCopyPasteCode = '00020126580014br.gov.bcb.pix0136natalvagas.pix@gmail.com52040000530398654049.905802BR5915NATAL VAGAS PRO6005NATAL62070503***6304E8A2';

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopyPasteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmPayment = () => {
    setIsVerifying(true);
    // Simula validação imediata do Pix e liberação
    setTimeout(() => {
      localStorage.setItem('natalvagas_resume_pro_unlocked', 'true');
      setIsVerifying(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-8">
        
        {/* Cabeçalho Pro */}
        <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
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

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">R$ 9,90</span>
            <span className="text-xs text-brand-200 uppercase font-semibold">Pagamento Único via Pix</span>
          </div>
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
              <span>Carta de Apresentação Otimizada</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dicas de Competências por Cargo</span>
            </div>
          </div>

          {/* Área do Pix */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 mb-3">
              {/* QR Code SVG formatado */}
              <div className="w-36 h-36 flex flex-col items-center justify-center bg-slate-900 rounded-lg p-2 text-white text-center">
                <QrCode className="w-24 h-24 text-white mx-auto" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">Pix R$ 9,90</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Abra o app do seu banco e escaneie o QR Code ou copie a chave Pix abaixo:
            </p>

            {/* Código Copia e Cola */}
            <div className="w-full mt-3 flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1.5 pl-3">
              <input 
                type="text" 
                readOnly 
                value={pixCopyPasteCode}
                className="text-[11px] text-slate-600 font-mono w-full bg-transparent focus:outline-hidden select-all truncate" 
              />
              <button
                onClick={handleCopy}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Pix</span>
                  </>
                )}
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
              <span>{isVerifying ? 'Liberando seu Acesso...' : 'Já paguei, Liberar Recursos Pro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Pagamento seguro via Banco Central
              </span>
              <a 
                href="https://wa.me/5584999999999?text=Ol%C3%A1%2C+preciso+de+ajuda+com+o+Pacote+Pro+do+Natal+Vagas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" /> Dúvidas no WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ProPaymentModal;
