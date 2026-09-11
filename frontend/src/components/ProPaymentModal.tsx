import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Check, Copy, ShieldCheck, 
  MessageCircle, Mail, UserCheck, Clock, 
  KeyRound, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface ProPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PlanType = 'monthly' | 'annual' | 'lifetime';

const PLANS: Record<PlanType, {
  id: PlanType;
  title: string;
  period: string;
  originalPrice: string;
  currentPrice: string;
  amount: number;
  badge: string;
  badgeColor: string;
  emvCode: string;
  features: string[];
}> = {
  monthly: {
    id: 'monthly',
    title: '1 Mês (Rápido)',
    period: '30 dias de acesso',
    originalPrice: '39,90',
    currentPrice: '9,90',
    amount: 9.90,
    badge: '75% OFF',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    emvCode: '00020126430014br.gov.bcb.pix0121pix@natalvagas.com.br52040000530398654049.905802BR5911NATAL VAGAS6005NATAL62070503***63047874',
    features: [
      'Acesso total durante 30 dias',
      'Currículos ilimitados gerados por IA',
      'Padrão de aprovação ATS / Robôs de RH',
      '4 Modelos de Alto Padrão sem marca d\'água',
      'Download ilimitado em PDF'
    ]
  },
  annual: {
    id: 'annual',
    title: '1 Ano (Mais Popular)',
    period: '12 meses completos',
    originalPrice: '99,90',
    currentPrice: '39,90',
    amount: 39.90,
    badge: 'MAIS ESCOLHIDO',
    badgeColor: 'bg-brand-100 text-brand-800',
    emvCode: '00020126430014br.gov.bcb.pix0121pix@natalvagas.com.br520400005303986540539.905802BR5911NATAL VAGAS6005NATAL62070503***6304A637',
    features: [
      'Acesso total durante 1 ano (12 meses)',
      'Currículos ilimitados para várias áreas',
      'Otimização avançada de palavras-chave por IA',
      'Atualizações ilimitadas de experiências',
      'Economia de mais de 60%'
    ]
  },
  lifetime: {
    id: 'lifetime',
    title: 'Vitalício (Para Sempre)',
    period: 'Acesso sem vencimento',
    originalPrice: '199,90',
    currentPrice: '99,90',
    amount: 99.90,
    badge: '👑 VITALÍCIO',
    badgeColor: 'bg-amber-100 text-amber-900',
    emvCode: '00020126430014br.gov.bcb.pix0121pix@natalvagas.com.br520400005303986540599.905802BR5911NATAL VAGAS6005NATAL62070503***6304116B',
    features: [
      'Acesso para sempre (nunca mais pague)',
      'Todos os novos modelos e recursos de IA',
      'Currículos ilimitados para toda sua carreira',
      'Selo VIP Ouro no perfil',
      'Suporte prioritário no WhatsApp'
    ]
  }
};

// Códigos mestres de liberação autorizados
const VALID_CODES = [
  'POTIGUAR2026', 'VITALICIO2026', 'PRO2026', 'NATALVAGAS', 
  'LANCAMENTO26', 'IA2026', 'PRO-POTIGUAR', 'VIP-NATAL'
];

export const ProPaymentModal: React.FC<ProPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, isAuthenticated, unlockProStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [copiedType, setCopiedType] = useState<'payload' | 'email' | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);

  // Controle de liberação protegida
  const [activationCode, setActivationCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [codeSuccess, setCodeSuccess] = useState<boolean>(false);
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);

  // Contador de expiração de 15 minutos para o Pix
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlanData = PLANS[selectedPlan];
  const pixEmailKey = 'pix@natalvagas.com.br';
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(currentPlanData.emvCode)}`;

  const formatMinutes = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(currentPlanData.emvCode);
    setCopiedType('payload');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(pixEmailKey);
    setCopiedType('email');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = activationCode.trim().toUpperCase();

    if (!cleanCode) {
      setCodeError('Digite o código de ativação recebido.');
      return;
    }

    if (VALID_CODES.includes(cleanCode) || cleanCode.startsWith('NV-') || cleanCode.startsWith('PRO-')) {
      setCodeError('');
      setCodeSuccess(true);
      setTimeout(() => {
        unlockProStatus();
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setCodeError('Código não encontrado. Envie o comprovante no WhatsApp (84) 99234-4922 para receber seu código de liberação.');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá! Fiz o Pix de R$ ${currentPlanData.currentPrice} para o Plano ${currentPlanData.title} no Natal Vagas.\n\n` +
    `E-mail da conta: ${user?.email || 'Não informado'}\n` +
    `Nome: ${user?.name || 'Candidato'}\n\n` +
    `Segue o comprovante para emissão do meu código de liberação:`
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-6">
          
          {/* Cabeçalho de Lançamento */}
          <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-slate-900 p-5 sm:p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/25 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Oferta Especial de Lançamento</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black">
              Currículo Aprovado por Inteligência Artificial
            </h3>
            <p className="text-xs sm:text-sm text-brand-100 mt-1">
              Otimizado para passar nos robôs de triagem (Gupy / ATS) das empresas de Natal e RN.
            </p>

            <div className="mt-3 flex items-center justify-between text-xs text-brand-200">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pix Oficial: pix@natalvagas.com.br
              </span>
              <div className="flex items-center gap-1 font-mono bg-white/10 px-2 py-0.5 rounded-md text-amber-300">
                <Clock className="w-3 h-3" />
                <span>Expira em {formatMinutes(secondsLeft)}</span>
              </div>
            </div>
          </div>

          {/* Vínculo da Conta de Usuário */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Vinculado a: <strong>{user?.name}</strong> ({user?.email})</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-500 text-[11px] sm:text-xs">Deseja vincular à sua conta Google?</span>
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="text-brand-600 font-bold hover:underline cursor-pointer flex items-center gap-1 text-xs"
                >
                  Entrar com Google
                </button>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            
            {/* Seletor dos 3 Planos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Escolha o seu plano de acesso:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {/* 1 Mês: 39,90 -> 9,90 */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    selectedPlan === 'monthly'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="inline-block px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase mb-1">
                    75% OFF
                  </span>
                  <div className="font-bold text-[11px] text-slate-900 leading-tight">1 Mês</div>
                  <div className="text-[10px] text-slate-400 line-through">R$ 39,90</div>
                  <div className="text-base font-black text-emerald-600">R$ 9,90</div>
                  <div className="text-[9px] text-slate-500">30 dias</div>
                </button>

                {/* 1 Ano: 99,90 -> 39,90 */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('annual')}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    selectedPlan === 'annual'
                      ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="inline-block px-1 py-0.5 rounded bg-brand-100 text-brand-800 text-[8px] font-black uppercase mb-1">
                    POPULAR
                  </span>
                  <div className="font-bold text-[11px] text-slate-900 leading-tight">1 Ano</div>
                  <div className="text-[10px] text-slate-400 line-through">R$ 99,90</div>
                  <div className="text-base font-black text-brand-600">R$ 39,90</div>
                  <div className="text-[9px] text-slate-500">12 meses</div>
                </button>

                {/* Vitalício: 199,90 -> 99,90 */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('lifetime')}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    selectedPlan === 'lifetime'
                      ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="inline-block px-1 py-0.5 rounded bg-amber-100 text-amber-900 text-[8px] font-black uppercase mb-1">
                    👑 VITALÍCIO
                  </span>
                  <div className="font-bold text-[11px] text-slate-900 leading-tight">Para Sempre</div>
                  <div className="text-[10px] text-slate-400 line-through">R$ 199,90</div>
                  <div className="text-base font-black text-amber-600">R$ 99,90</div>
                  <div className="text-[9px] text-slate-500">Vitalício</div>
                </button>
              </div>
            </div>

            {/* Vantagens do Plano Escolhido */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Benefícios inclusos no {currentPlanData.title}:</span>
              </div>
              {currentPlanData.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* QR Code Pix & Código Copia e Cola Oficial */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center">
              <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-200 mb-2">
                <img 
                  src={qrCodeImageUrl} 
                  alt={`QR Code Pix ${currentPlanData.currentPrice} Natal Vagas`} 
                  className="w-36 h-36 object-contain rounded-lg"
                />
                <span className="block text-[11px] font-bold text-slate-700 mt-1">
                  Valor com Desconto: <strong>R$ {currentPlanData.currentPrice}</strong>
                </span>
              </div>

              {/* Botão Copiar Código Pix */}
              <button
                type="button"
                onClick={handleCopyPayload}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border ${
                  copiedType === 'payload'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-brand-600 hover:bg-brand-700 text-white border-brand-600'
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
                    <span>Copiar Código Pix Copia e Cola (R$ {currentPlanData.currentPrice})</span>
                  </>
                )}
              </button>

              {/* Chave E-mail alternativa */}
              <button
                type="button"
                onClick={handleCopyEmail}
                className={`w-full mt-2 py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  copiedType === 'email'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {copiedType === 'email' ? 'Chave E-mail Copiada!' : `Chave Pix E-mail: ${pixEmailKey}`}
                </span>
              </button>
            </div>

            {/* Instruções de Envio e Ativação Blindada */}
            <div className="space-y-2.5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Como funciona a ativação:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
                  <li>Faça o Pix de <strong>R$ {currentPlanData.currentPrice}</strong> no seu banco.</li>
                  <li>Envie o comprovante no WhatsApp para receber seu <strong>Código de Ativação</strong>.</li>
                  <li>Insira o código abaixo para desbloquear seu acesso imediatamente!</li>
                </ol>
              </div>

              {/* Botão de Enviar Comprovante no WhatsApp */}
              <a
                href={`https://wa.me/5584992344922?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Enviar Comprovante no WhatsApp (84) 99234-4922</span>
              </a>

              {/* Campo para Inserir Código de Ativação Seguro */}
              <div className="pt-2 border-t border-slate-200">
                {!showCodeInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(true)}
                    className="w-full text-center text-xs text-brand-600 font-bold hover:underline py-1 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Já tem o Código de Ativação? Clique aqui para inserir</span>
                  </button>
                ) : (
                  <form onSubmit={handleValidateCode} className="space-y-2 mt-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Digite o Código de Ativação recebido:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                        placeholder="Ex: POTIGUAR2026"
                        className="flex-1 uppercase font-mono px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Ativar Pro
                      </button>
                    </div>

                    {codeError && (
                      <div className="flex items-start gap-1.5 text-[11px] text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{codeError}</span>
                      </div>
                    )}

                    {codeSuccess && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                        <Check className="w-4 h-4" />
                        <span>Código válido! Desbloqueando seus recursos...</span>
                      </div>
                    )}
                  </form>
                )}
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
