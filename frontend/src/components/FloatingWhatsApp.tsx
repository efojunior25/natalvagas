import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Users, ShieldCheck, ArrowRight, Building2 } from 'lucide-react';

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  groupUrl?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber,
  groupUrl
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Número oficial de WhatsApp Business (padrão: 5584921869397)
  const activeNumber = phoneNumber || (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '5584921869397';
  const cleanNumber = activeNumber.replace(/\D/g, '');

  // Link do grupo de vagas do WhatsApp
  const activeGroupUrl = groupUrl || (import.meta.env.VITE_WHATSAPP_GROUP_URL as string | undefined) || `https://wa.me/${cleanNumber}?text=${encodeURIComponent('Olá! Gostaria de entrar no Grupo Oficial de Vagas do Natal Vagas.')}`;

  // Fecha o popover ao clicar fora ou apertar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    setHasNewNotification(false);
  };

  const getDirectChatUrl = (message: string) => {
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-40 print:hidden font-sans">
      {/* Janela de Atendimento Flutuante */}
      {isOpen && (
        <div className="mb-3 w-[320px] sm:w-[350px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
          
          {/* Topo Verde WhatsApp */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-all cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/assets/avatar-natalvagas-400.png"
                  alt="Natal Vagas WhatsApp"
                  className="w-12 h-12 rounded-full border-2 border-white/60 bg-white object-contain p-0.5 shadow-sm"
                  onError={(e) => {
                    // Fallback para ícone transparente se avatar ainda não tiver carregado
                    (e.target as HTMLElement).setAttribute('src', '/assets/icone-lupa-natalvagas.png');
                  }}
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-emerald-700 rounded-full" />
              </div>

              <div>
                <h4 className="text-sm font-black leading-tight flex items-center gap-1.5 text-white">
                  <span>Natal Vagas Oficial</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                </h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Atendimento WhatsApp Business
                </p>
              </div>
            </div>
          </div>

          {/* Balão de Mensagem */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300 space-y-2 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-xs border border-slate-200/80 dark:border-slate-700/80 leading-relaxed">
              👋 Olá! Seja bem-vindo ao <strong>Natal Vagas</strong>. Como podemos te ajudar hoje?
            </div>
          </div>

          {/* Opções de Ação Direta */}
          <div className="p-3 space-y-2">
            
            {/* Opção 1: Entrar no Grupo de Vagas */}
            <a
              href={activeGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 transition-all text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    Seguir Canal Oficial no WhatsApp
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Histórico completo e alertas diários
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1" />
            </a>

            {/* Opção 2: Falar com o Atendimento / Suporte */}
            <a
              href={getDirectChatUrl("Olá! Vim pelo site Natal Vagas e gostaria de falar com o atendimento.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 transition-all text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <MessageCircle className="w-4 h-4 fill-white" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    Conversar com Atendimento
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tire dúvidas ou envie feedback
                  </span>
                </div>
              </div>
              <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </a>

            {/* Opção 3: Sou Empresa e quero anunciar */}
            <a
              href={getDirectChatUrl("Olá! Sou uma empresa de Natal e gostaria de informações para anunciar vagas e contratar candidatos.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs text-slate-600 dark:text-slate-400 group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                <span className="text-[11px] font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  Sou Empresa e quero contratar
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

          </div>

          <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Canal Oficial • Resposta rápida de Seg a Sáb
            </span>
          </div>
        </div>
      )}

      {/* Botão Flutuante Principal */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
        title="Falar no WhatsApp Oficial Natal Vagas"
        aria-label="Abrir conversa no WhatsApp"
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 fill-white" />
            {hasNewNotification && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white text-[9px] font-black text-white items-center justify-center">
                  1
                </span>
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default FloatingWhatsApp;
