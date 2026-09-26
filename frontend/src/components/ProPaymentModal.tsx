import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  X, Sparkles, Check, Copy, ShieldCheck, 
  MessageCircle, Mail, UserCheck, Clock, 
  KeyRound, AlertCircle, CreditCard, Zap,
  Lock, CheckCircle2, Loader2, ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import { QRCodeSVG } from "qrcode.react";
import { buildPixEMV, generateUniqueTxid } from "../services/paymentService";

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
  const [paymentOrder, setPaymentOrder] = useState<{ txid: string; amount: number; pixCode: string; expiresAt: string } | null>(null);
  const [paymentError, setPaymentError] = useState<string>("");

  // Controle de liberação protegida por código via API segura
  const [activationCode, setActivationCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  const [codeSuccess, setCodeSuccess] = useState<boolean>(false);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);

  // Controle de Desconto Social PcD (50% OFF) com Laudo
  const [isPcdDiscountApplied, setIsPcdDiscountApplied] = useState<boolean>(false);
  const [pcdCoupon, setPcdCoupon] = useState<string>("");
  const [pcdCouponError, setPcdCouponError] = useState<string>("");
  const [pcdCouponSuccess, setPcdCouponSuccess] = useState<string>("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [showPcdInput, setShowPcdInput] = useState<boolean>(false);

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

  const numericAmount = useMemo(() => {
    if (paymentOrder?.amount) return paymentOrder.amount;
    const base = currentPlanData.amount;
    return isPcdDiscountApplied ? Number((base * 0.5).toFixed(2)) : base;
  }, [paymentOrder, currentPlanData.amount, isPcdDiscountApplied]);

  const fallbackTxid = useMemo(() => generateUniqueTxid("PRO"), [selectedPlan, isPcdDiscountApplied]);
  const fallbackPixPayload = useMemo(() => {
    return buildPixEMV({
      pixKey: pixEmailKey,
      amount: numericAmount,
      txid: fallbackTxid,
      merchantName: "NATAL VAGAS",
      merchantCity: "NATAL"
    });
  }, [pixEmailKey, numericAmount, fallbackTxid]);

  const currentPixPayload = paymentOrder?.pixCode || fallbackPixPayload;

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    let active = true;
    setPaymentOrder(null); setPaymentError(""); setAutoApproved(false);
    fetch('/api/payments/orders', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: selectedPlan }) })
      .then(async res => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => { if (!active) return; if (ok && data.order) setPaymentOrder(data.order); else setPaymentError(data.message || 'Não foi possível criar o pedido.'); })
      .catch(() => { if (active) setPaymentError('Serviço de pagamentos indisponível.'); });
    return () => { active = false; };
  }, [isOpen, isAuthenticated, selectedPlan]);

  // POLLING AUTOMÁTICO EM TEMPO REAL DO STATUS DO PIX
  useEffect(() => {
    if (!isOpen || paymentMethod !== "pix" || autoApproved || !paymentOrder) return;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/pix/status/${paymentOrder.txid}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === "approved" && isMounted) {
            setAutoApproved(true);
            unlockProStatus();
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
  }, [isOpen, paymentMethod, paymentOrder, selectedPlan, autoApproved, unlockProStatus, onSuccess, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const formatMinutes = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ":" + (sec < 10 ? "0" : "") + sec;
  };

  const handleCopyPayload = () => {
    if (!currentPixPayload) return;
    navigator.clipboard.writeText(currentPixPayload);
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
          unlockProStatus();
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

  const effectivePrice = numericAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleApplyPcdCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pcdCoupon.trim().toUpperCase();
    if (!clean) {
      setPcdCouponError("Digite o código do cupom.");
      return;
    }

    setIsValidatingCoupon(true);
    setPcdCouponError("");
    setPcdCouponSuccess("");

    try {
      const res = await fetch("/api/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, email: user?.email || "" })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setIsPcdDiscountApplied(true);
        setPcdCouponSuccess(data.message || "Cupom validado com sucesso! 50% de desconto aplicado.");
        setPcdCouponError("");
      } else {
        setPcdCouponError(data.message || "Cupom inválido ou já utilizado. Envie seu laudo no WhatsApp para receber seu cupom de uso único.");
      }
    } catch (err) {
      setPcdCouponError("Erro de conexão ao validar o cupom. Verifique sua conexão e tente novamente.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    "Olá! Fiz o pagamento de R$ " + effectivePrice + (isPcdDiscountApplied ? " (com Desconto Social PcD 50%)" : "") + " para o Plano " + currentPlanData.title + " no Natal Vagas.\n\n" +
    "E-mail da conta: " + (user?.email || "Não informado") + "\n" +
    "Nome: " + (user?.name || "Candidato") + "\n\n" +
    "Segue o comprovante:"
  );

  const whatsappCardMessage = encodeURIComponent(
    "Olá! Gostaria de pagar o Plano " + currentPlanData.title + " (R$ " + effectivePrice + (isPcdDiscountApplied ? " com Desconto PcD 50%" : "") + ") no Cartão de Crédito sem juros.\n\n" +
    "E-mail: " + (user?.email || "Não informado") + "\n" +
    "Nome: " + (user?.name || "Candidato") + "\n\n" +
    "Poderia me enviar o link seguro de pagamento?"
  );

  const whatsappLaudoMessage = encodeURIComponent(
    "Olá, Edson! Sou candidato PcD no Natal Vagas e gostaria de solicitar meu desconto de 50% no Plano PRO (" + currentPlanData.title + ").\n\n" +
    "Segue meu Laudo Médico em anexo para sua avaliação.\n" +
    "Meu e-mail cadastrado no site: " + (user?.email || "Não informado") + "\n" +
    "Meu nome: " + (user?.name || "Candidato")
  );

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200 text-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho Fixo - Pinned no topo para NUNCA ser cortado */}
          <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-slate-900 p-4 sm:p-5 text-white relative shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 text-white/90 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-all cursor-pointer z-10"
              title="Fechar janela (Esc)"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/25 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Oferta Especial de Lançamento</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black leading-tight pr-8">
              Currículo Aprovado por Inteligência Artificial
            </h3>
            <p className="text-[11px] sm:text-xs text-brand-100 mt-0.5">
              Otimizado para passar nos robôs de triagem (Gupy / ATS) das empresas do RN.
            </p>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-brand-200">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pagamento Seguro Efí Bank
              </span>
              <div className="flex items-center gap-1 font-mono bg-white/10 px-2 py-0.5 rounded-md text-amber-300 text-[10px]">
                <Clock className="w-3 h-3" />
                <span>Expira em {formatMinutes(secondsLeft)}</span>
              </div>
            </div>
          </div>

          {/* Vínculo da Conta (shrink-0) */}
          <div className="bg-amber-50/90 border-b border-amber-200 px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Assinatura será vinculada a: <strong>{user?.name}</strong> ({user?.email})</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Para manter seus <strong>30 dias Pro</strong> ativos em qualquer celular ou PC:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold rounded-lg transition-all text-xs shrink-0 shadow-xs cursor-pointer"
                >
                  Login / Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* Corpo Rolável Interno */}
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
            
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
                    {isPcdDiscountApplied ? "50% PcD" : "75% OFF"}
                  </span>
                  <div className="font-bold text-[11px] text-slate-900 leading-tight">1 Mês</div>
                  <div className="text-[10px] text-slate-400 line-through">{isPcdDiscountApplied ? "R$ 9,90" : "R$ 39,90"}</div>
                  <div className="text-base font-black text-emerald-600">
                    {isPcdDiscountApplied ? "R$ 4,95" : "R$ 9,90"}
                  </div>
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
                    {isPcdDiscountApplied ? "50% PcD" : "POPULAR"}
                  </span>
                  <div className="font-bold text-[11px] text-slate-900 leading-tight">1 Ano</div>
                  <div className="text-[10px] text-slate-400 line-through">{isPcdDiscountApplied ? "R$ 39,90" : "R$ 99,90"}</div>
                  <div className="text-base font-black text-brand-600">
                    {isPcdDiscountApplied ? "R$ 19,95" : "R$ 39,90"}
                  </div>
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
                    {isPcdDiscountApplied ? "50% PcD" : "👑 VITALÍCIO"}
                  </span>
                  <div className="font-bold text-[11px] text-slate-900 leading-tight">Para Sempre</div>
                  <div className="text-[10px] text-slate-400 line-through">{isPcdDiscountApplied ? "R$ 99,90" : "R$ 199,90"}</div>
                  <div className="text-base font-black text-amber-600">
                    {isPcdDiscountApplied ? "R$ 49,95" : "R$ 99,90"}
                  </div>
                  <div className="text-[9px] text-slate-500">Vitalício</div>
                </button>
              </div>
            </div>

            {/* Card de Desconto Social PcD (50% OFF) */}
            {false && <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0 mt-0.5">♿</span>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-blue-950">Desconto Social PcD (50% OFF)</h4>
                    <span className="text-[9px] font-black bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-full uppercase">
                      Inclusão
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-900 mt-1 leading-relaxed">
                    Candidatos com deficiência têm <strong>50% de desconto</strong> em qualquer plano mediante validação do laudo médico pelo administrador.
                  </p>
                  
                  {isPcdDiscountApplied ? (
                    <div className="mt-2 p-2 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Desconto PcD Ativo: 50% OFF aplicado no Pix!
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsPcdDiscountApplied(false)}
                        className="text-[10px] text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <a
                        href={"https://wa.me/5584992344922?text=" + whatsappLaudoMessage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>Enviar Laudo no WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowPcdInput(!showPcdInput)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Já recebi meu cupom
                      </button>
                    </div>
                  )}

                  {showPcdInput && !isPcdDiscountApplied && (
                    <form onSubmit={handleApplyPcdCoupon} className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Digite seu cupom"
                        value={pcdCoupon}
                        disabled={isValidatingCoupon}
                        onChange={(e) => {
                          setPcdCoupon(e.target.value);
                          setPcdCouponError("");
                        }}
                        className="w-36 px-2.5 py-1 text-xs border border-blue-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-bold text-slate-800 bg-white disabled:bg-slate-100"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingCoupon}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {isValidatingCoupon ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Validando...</span>
                          </>
                        ) : (
                          <span>Ativar 50%</span>
                        )}
                      </button>
                      {pcdCouponError && (
                        <span className="w-full text-[11px] text-red-600 font-medium block">{pcdCouponError}</span>
                      )}
                    </form>
                  )}

                  {isPcdDiscountApplied && (
                    <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pcdCouponSuccess || "Cupom PcD de 50% ativado com sucesso!"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>}

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
                  <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-200 mb-2 flex flex-col items-center">
                    <div className="p-2 bg-white rounded-xl">
                      <QRCodeSVG
                        value={currentPixPayload}
                        size={140}
                        level="M"
                        includeMargin={false}
                        aria-label={"QR Code Pix " + effectivePrice + " Natal Vagas"}
                      />
                    </div>
                    <span className="block text-[11px] font-bold text-slate-700 mt-1">
                      Valor a Pagar: <strong className="text-emerald-600 text-xs">R$ {effectivePrice}</strong>
                      {isPcdDiscountApplied && (
                        <span className="text-[10px] text-blue-600 block font-semibold">♿ Desconto PcD 50% Ativado</span>
                      )}
                    </span>
                  </div>

                  {/* Status do Pix em Tempo Real */}
                  <div className="w-full mb-2.5 p-2 rounded-xl bg-slate-100/90 border border-slate-200 text-center">
                    {autoApproved ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span>Pagamento Confirmado! Desbloqueando Acesso Pro...</span>
                      </div>
                    ) : paymentOrder ? (
                      <div className="flex items-center justify-center gap-2 text-slate-600 text-[11px]">
                        <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                        <span>Aguardando confirmação Pix em tempo real...</span>
                      </div>
                    ) : paymentError ? (
                      <div className="text-rose-700 text-xs font-bold">{paymentError}</div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-semibold">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        <span>Escaneie o QR Code ou use o Pix Copia e Cola</span>
                      </div>
                    )}
                  </div>

                  {isPcdDiscountApplied ? (
                    <div className="w-full mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 text-left">
                      💡 Com o <strong>Desconto PcD de 50%</strong>, transfira exatamente <strong>R$ {effectivePrice}</strong> para a <strong>Chave Pix E-mail</strong> abaixo e envie o comprovante no botão verde para ativação imediata:
                    </div>
                  ) : null}

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
                        <span>Copiar Código Pix Copia e Cola (R$ {effectivePrice})</span>
                      </>
                    )}
                  </button>

                  {/* Botão de Liberação Imediata se já pagou */}
                  <button
                    type="button"
                    onClick={() => {
                      setAutoApproved(true);
                      unlockProStatus();
                      setTimeout(() => {
                        onSuccess();
                        onClose();
                      }, 1200);
                    }}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Já fiz o Pix (Liberar Acesso Pro Agora)</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="py-2 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{copiedType === "email" ? "Chave Copiada!" : `Chave: ${pixEmailKey}`}</span>
                    </button>

                    <a
                      href={"https://wa.me/5584992344922?text=" + whatsappMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      <span>Comprovante WhatsApp</span>
                    </a>
                  </div>
                </div>
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
        title="Vincular Plano Pro à sua Conta"
        subtitle="Entre ou cadastre-se grátis para vincular seu Acesso Pro de 30 dias e salvar seus currículos na nuvem."
      />
    </>,
    document.body
  );
};
export default ProPaymentModal;
