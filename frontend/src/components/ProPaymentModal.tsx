import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, Sparkles, Check, Copy, ShieldCheck, 
  MessageCircle, Mail, UserCheck, Clock, 
  KeyRound, AlertCircle, CreditCard, Zap,
  Lock, CheckCircle2, Loader2, ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";

interface ProPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PlanType = "monthly" | "annual" | "lifetime";
type PaymentMethod = "pix" | "card";

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
  txid: string;
  features: string[];
  installments: { count: number; value: string; label: string }[];
}> = {
  monthly: {
    id: "monthly",
    title: "1 Mês (Rápido)",
    period: "30 dias de acesso",
    originalPrice: "39,90",
    currentPrice: "9,90",
    amount: 9.90,
    badge: "75% OFF",
    badgeColor: "bg-emerald-100 text-emerald-800",
    txid: "cbc09e55682a4802ae728295c0d6fa97",
    emvCode: "00020101021226830014BR.GOV.BCB.PIX2561qrcodespix.sejaefi.com.br/v2/160b259449f34a75a8e3db86f382a64b5204000053039865802BR5905EFISA6008SAOPAULO62070503***6304FA7C",
    features: [
      "Acesso total durante 30 dias",
      "Currículos ilimitados gerados por IA",
      "Padrão de aprovação ATS / Robôs de RH",
      "4 Modelos de Alto Padrão sem marca d'água",
      "Download ilimitado em PDF"
    ],
    installments: [
      { count: 1, value: "9,90", label: "1x de R$ 9,90 à vista" }
    ]
  },
  annual: {
    id: "annual",
    title: "1 Ano (Mais Popular)",
    period: "12 meses completos",
    originalPrice: "99,90",
    currentPrice: "39,90",
    amount: 39.90,
    badge: "MAIS ESCOLHIDO",
    badgeColor: "bg-brand-100 text-brand-800",
    txid: "34c4c8898b574e88aac634e77dca7406",
    emvCode: "00020101021226830014BR.GOV.BCB.PIX2561qrcodespix.sejaefi.com.br/v2/18b78429795c4f539db2b39dc69c16a15204000053039865802BR5905EFISA6008SAOPAULO62070503***63046754",
    features: [
      "Acesso total durante 1 ano (12 meses)",
      "Currículos ilimitados para várias áreas",
      "Otimização avançada de palavras-chave por IA",
      "Atualizações ilimitadas de experiências",
      "Economia de mais de 60%"
    ],
    installments: [
      { count: 1, value: "39,90", label: "1x de R$ 39,90 à vista" },
      { count: 2, value: "19,95", label: "2x de R$ 19,95 sem juros" },
      { count: 3, value: "13,30", label: "3x de R$ 13,30 sem juros" }
    ]
  },
  lifetime: {
    id: "lifetime",
    title: "Vitalício (Para Sempre)",
    period: "Acesso sem vencimento",
    originalPrice: "199,90",
    currentPrice: "99,90",
    amount: 99.90,
    badge: "👑 VITALÍCIO",
    badgeColor: "bg-amber-100 text-amber-900",
    txid: "dddc590b669b4f8fa78ac6939fa8d687",
    emvCode: "00020101021226830014BR.GOV.BCB.PIX2561qrcodespix.sejaefi.com.br/v2/49bab83f90fe4aacadb9d889f126ea085204000053039865802BR5905EFISA6008SAOPAULO62070503***63049EA6",
    features: [
      "Acesso para sempre (nunca mais pague)",
      "Todos os novos modelos e recursos de IA",
      "Currículos ilimitados para toda sua carreira",
      "Selo VIP Ouro no perfil",
      "Suporte prioritário no WhatsApp"
    ],
    installments: [
      { count: 1, value: "99,90", label: "1x de R$ 99,90 à vista" },
      { count: 2, value: "49,95", label: "2x de R$ 49,95 sem juros" },
      { count: 3, value: "33,30", label: "3x de R$ 33,30 sem juros" },
      { count: 6, value: "16,65", label: "6x de R$ 16,65 sem juros" },
      { count: 12, value: "8,32", label: "12x de R$ 8,32 sem juros" }
    ]
  }
};

export const ProPaymentModal: React.FC<ProPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, isAuthenticated, unlockProStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [copiedType, setCopiedType] = useState<"payload" | "email" | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);

  // Status de automação do Pix
  const [autoApproved, setAutoApproved] = useState<boolean>(false);

  // Controle de liberação protegida por código via API segura
  const [activationCode, setActivationCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  const [codeSuccess, setCodeSuccess] = useState<boolean>(false);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);

  // Trava a rolagem da tela e escuta tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Contagem regressiva
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const currentPlanData = PLANS[selectedPlan];
  const pixEmailKey = "pix@natalvagas.com.br";
  const qrCodeImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=" + encodeURIComponent(currentPlanData.emvCode);

  // POLLING AUTOMÁTICO EM TEMPO REAL DO STATUS DO PIX
  useEffect(() => {
    if (!isOpen || paymentMethod !== "pix" || autoApproved) return;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/pix/status/${currentPlanData.txid}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === "approved" && isMounted) {
            setAutoApproved(true);
            unlockProStatus(data.token, data.plan || selectedPlan);
            setTimeout(() => {
              if (isMounted) {
                onSuccess();
                onClose();
              }
            }, 2500);
          }
        }
      } catch (err) {
        // Silencioso para não interromper a interface
      }
    };

    // Consulta inicial e intervalo a cada 3,5 segundos
    const interval = setInterval(checkStatus, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, paymentMethod, currentPlanData.txid, selectedPlan, autoApproved, unlockProStatus, onSuccess, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const formatMinutes = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ":" + (sec < 10 ? "0" : "") + sec;
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(currentPlanData.emvCode);
    setCopiedType("payload");
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(pixEmailKey);
    setCopiedType("email");
    setTimeout(() => setCopiedType(null), 3000);
  };

  // Validação segura de código de ativação no backend/Cloudflare Function
  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = activationCode.trim().toUpperCase();

    if (!cleanCode) {
      setCodeError("Digite o código de ativação recebido.");
      return;
    }

    setIsValidatingCode(true);
    setCodeError("");

    try {
      const res = await fetch("/api/payments/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, email: user?.email || "" })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setCodeSuccess(true);
        setTimeout(() => {
          unlockProStatus(data.token, data.plan || selectedPlan);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setCodeError(data.message || "Código não reconhecido. Envie seu comprovante no WhatsApp (84) 99234-4922 para receber um código exclusivo.");
      }
    } catch (err) {
      setCodeError("Erro de conexão ao validar o código. Tente novamente ou fale com o suporte.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    "Olá! Fiz o pagamento de R$ " + currentPlanData.currentPrice + " para o Plano " + currentPlanData.title + " no Natal Vagas.\n\n" +
    "E-mail da conta: " + (user?.email || "Não informado") + "\n" +
    "Nome: " + (user?.name || "Candidato") + "\n\n" +
    "Segue o comprovante:"
  );

  const whatsappCardMessage = encodeURIComponent(
    "Olá! Gostaria de pagar o Plano " + currentPlanData.title + " (R$ " + currentPlanData.currentPrice + ") no Cartão de Crédito sem juros.\n\n" +
    "E-mail: " + (user?.email || "Não informado") + "\n" +
    "Nome: " + (user?.name || "Candidato") + "\n\n" +
    "Poderia me enviar o link seguro de pagamento?"
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-6">
          
          {/* Cabeçalho */}
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
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pagamento Seguro Efí Bank
              </span>
              <div className="flex items-center gap-1 font-mono bg-white/10 px-2 py-0.5 rounded-md text-amber-300">
                <Clock className="w-3 h-3" />
                <span>Expira em {formatMinutes(secondsLeft)}</span>
              </div>
            </div>
          </div>

          {/* Vínculo da Conta */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Vinculado a: <strong>{user?.name}</strong> ({user?.email})</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-500 text-[11px] sm:text-xs">Deseja salvar seu currículo online?</span>
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
            
            {/* 1. Seletor de Planos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Escolha o seu plano de acesso:
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("monthly")}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    selectedPlan === "monthly"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
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

                <button
                  type="button"
                  onClick={() => setSelectedPlan("annual")}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    selectedPlan === "annual"
                      ? "border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
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

                <button
                  type="button"
                  onClick={() => setSelectedPlan("lifetime")}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    selectedPlan === "lifetime"
                      ? "border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
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

            {/* Benefícios */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Benefícios no {currentPlanData.title}:</span>
              </div>
              {currentPlanData.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* 2. Forma de Pagamento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Forma de pagamento:
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === "pix"
                      ? "bg-white text-brand-700 shadow-xs ring-1 ring-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                  <span>Pix (Instantâneo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>
            </div>

            {/* CONTEÚDO PIX */}
            {paymentMethod === "pix" && (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center">
                  <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-200 mb-2">
                    <img 
                      src={qrCodeImageUrl} 
                      alt={"QR Code Pix " + currentPlanData.currentPrice + " Natal Vagas"} 
                      className="w-36 h-36 object-contain rounded-lg"
                    />
                    <span className="block text-[11px] font-bold text-slate-700 mt-1">
                      Valor com Desconto: <strong>R$ {currentPlanData.currentPrice}</strong>
                    </span>
                  </div>

                  {/* Status do Pix em Tempo Real */}
                  <div className="w-full mb-2.5 p-2 rounded-xl bg-slate-100/90 border border-slate-200 text-center">
                    {autoApproved ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span>Pagamento Confirmado! Desbloqueando Acesso Pro...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-600 text-[11px]">
                        <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                        <span>Aguardando confirmação Pix em tempo real...</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border ${
                      copiedType === "payload"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-brand-600 hover:bg-brand-700 text-white border-brand-600"
                    }`}
                  >
                    {copiedType === "payload" ? (
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

                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className={`w-full mt-2 py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      copiedType === "email"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {copiedType === "email" ? "Chave E-mail Copiada!" : "Chave Pix E-mail: " + pixEmailKey}
                    </span>
                  </button>
                </div>

                <a
                  href={"https://wa.me/5584992344922?text=" + whatsappMessage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Enviar Comprovante no WhatsApp (84) 99234-4922</span>
                </a>
              </div>
            )}

            {/* CONTEÚDO CARTÃO DE CRÉDITO */}
            {paymentMethod === "card" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> Cartão de Crédito
                  </span>
                  <span className="font-bold text-slate-600">Visa • Master • Elo • Amex</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-left">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Plano Selecionado:</span>
                    <span className="text-brand-600">{currentPlanData.title}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>Valor Total:</span>
                    <strong className="text-slate-900 text-sm">R$ {currentPlanData.currentPrice}</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Opções de parcelamento: </span>
                    <span className="font-semibold text-slate-700">
                      {currentPlanData.installments[currentPlanData.installments.length - 1]?.label}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-indigo-900 text-xs leading-relaxed space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Para pagamento com cartão sem juros e com máxima proteção antifraude, geramos seu link oficial e exclusivo de checkout instantaneamente.
                    </span>
                  </div>
                </div>

                <a
                  href={"https://wa.me/5584992344922?text=" + whatsappCardMessage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Receber Link de Cartão no WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <div className="text-center">
                  <span className="text-[10px] text-slate-400">
                    Transação protegida e monitorada via Efí Bank / WhatsApp Oficial Natal Vagas.
                  </span>
                </div>
              </div>
            )}

            {/* Código de Ativação Manual via API Segura */}
            <div className="pt-2 border-t border-slate-200">
              {!showCodeInput ? (
                <button
                  type="button"
                  onClick={() => setShowCodeInput(true)}
                  className="w-full text-center text-xs text-brand-600 font-bold hover:underline py-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Já tem um Código de Liberação? Clique aqui para inserir</span>
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
                      disabled={isValidatingCode || codeSuccess}
                      className="flex-1 uppercase font-mono px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isValidatingCode || codeSuccess}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isValidatingCode && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Ativar Pro</span>
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Conectar com o Google"
        subtitle="Vincule sua conta para manter seus currículos salvos para sempre."
      />
    </>,
    document.body
  );
};
export default ProPaymentModal;
