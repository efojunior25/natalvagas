import React, { useState } from 'react';
import { X, CheckCircle2, Crown, ArrowRight, ShieldCheck, Flame, Users } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

interface ResumeLaunchOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: () => void;
}

export const ResumeLaunchOfferModal: React.FC<ResumeLaunchOfferModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  const [showAdAfterClose, setShowAdAfterClose] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    // Ao fechar, podemos acionar o slot de anúncio
    setShowAdAfterClose(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden flex flex-col animate-scaleUp text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo com Destaque Dourado */}
        <div className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-5 sm:p-6 text-center">
          <button 
            onClick={handleClose}
            aria-label="Fechar oferta"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge Prova Social */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Oferta Exclusiva de Lançamento</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Destaque seu Currículo nas Empresas do RN
          </h2>

          <p className="text-xs sm:text-sm text-amber-100 mt-1.5 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-amber-200 shrink-0" />
            <span>Mais de <strong>1.420 potiguares</strong> já criaram seus currículos esta semana</span>
          </p>
        </div>

        {/* Corpo da Oferta */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Benefícios Rápidos */}
          <div className="space-y-2 text-xs sm:text-sm text-slate-700 bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Formatos ATS & Gupy</strong>: modelos desenhados para não serem descartados pelos robôs de seleção de Natal.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Design Moderno & Executivo</strong>: modelos visualmente elegantes para enviar por e-mail ou imprimir.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Download ilimitado em PDF</strong> sem marcas d'água no celular e computador.</span>
            </div>
          </div>

          {/* Cards de Preços de Lançamento */}
          <div className="grid grid-cols-3 gap-2 text-center">
            
            {/* Mensal */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">1 Mês</span>
              <div className="my-1">
                <span className="text-[10px] line-through text-slate-400 block">R$ 39,90</span>
                <span className="text-base font-black text-brand-600 leading-tight">R$ 9,90</span>
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded-sm">75% OFF</span>
            </div>

            {/* Anual (Destaque) */}
            <div className="relative p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/50 flex flex-col justify-between shadow-xs">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase whitespace-nowrap">
                Mais Escolhido
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-800 mt-1">1 Ano</span>
              <div className="my-1">
                <span className="text-[10px] line-through text-slate-400 block">R$ 99,90</span>
                <span className="text-base font-black text-amber-700 leading-tight">R$ 39,90</span>
              </div>
              <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1 rounded-sm">60% OFF</span>
            </div>

            {/* Vitalício */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Vitalício</span>
              <div className="my-1">
                <span className="text-[10px] line-through text-slate-400 block">R$ 199,90</span>
                <span className="text-base font-black text-purple-700 leading-tight">R$ 99,90</span>
              </div>
              <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1 rounded-sm">VIP</span>
            </div>

          </div>

          {/* Botão de Ação Primário */}
          <button
            onClick={() => {
              onClose();
              onSelectPlan();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-200" />
            <span>Liberar Modelos PRO (A partir de R$ 9,90)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Botão Secundário: Continuar no Grátis */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Continuar com o modelo ATS Grátis
            </button>

            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pix Seguro</span>
            </span>
          </div>

        </div>

        {/* Slot de Anúncio Preparado (Ativado quando AdSense for liberado) */}
        {showAdAfterClose && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <AdPlaceholder format="horizontal" />
          </div>
        )}

      </div>
    </div>
  );
};
export default ResumeLaunchOfferModal;
