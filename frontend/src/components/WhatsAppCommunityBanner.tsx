import React from 'react';
import { MessageCircle, Send, Instagram, Facebook, Bell, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface WhatsAppCommunityBannerProps {
  channelUrl?: string;
}

export const WhatsAppCommunityBanner: React.FC<WhatsAppCommunityBannerProps> = ({
  channelUrl = 'https://wa.me/5584992344922?text=Ol%C3%A1%2C+quero+entrar+na+lista+de+espera+dos+grupos+VIP+e+redes+do+Natal+Vagas'
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800">
      {/* Decoração de fundo sutil */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        
        {/* Lado Esquerdo: Mensagem e Proposta de Valor */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Comunidades Oficiais • Em Lançamento</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug text-white">
            Receba novas vagas no RN direto no seu celular
          </h3>

          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Estamos finalizando a abertura dos canais oficiais do Natal Vagas. Vagas em tempo real, sem spam e 100% gratuitas para você se candidatar antes de todo mundo!
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" /> 100% Gratuito
            </span>
            <span>•</span>
            <span>Apenas vagas reais no RN</span>
            <span>•</span>
            <span>Alertas diários</span>
          </div>
        </div>

        {/* Lado Direito: Grid dos 4 Canais com Selo "Em Breve" */}
        <div className="w-full lg:w-auto flex flex-col gap-3 min-w-[300px] sm:min-w-[340px]">
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* WhatsApp VIP */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-emerald-500/50 transition-colors flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                  Em breve
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Grupo WhatsApp</span>
                <span className="text-[10px] text-slate-400">Alertas instantâneos</span>
              </div>
            </div>

            {/* Telegram */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-sky-500/50 transition-colors flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-md">
                  Em breve
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Canal Telegram</span>
                <span className="text-[10px] text-slate-400">Histórico completo</span>
              </div>
            </div>

            {/* Instagram */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-pink-500/50 transition-colors flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.5 rounded-md">
                  Em breve
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Instagram</span>
                <span className="text-[10px] text-slate-400">Dicas & Vagas do Dia</span>
              </div>
            </div>

            {/* Facebook */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-blue-500/50 transition-colors flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Facebook className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-md">
                  Em breve
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Facebook</span>
                <span className="text-[10px] text-slate-400">Página & Comunidade</span>
              </div>
            </div>

          </div>

          {/* Botão de Lista de Espera */}
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-600/30 transition-all group cursor-pointer"
          >
            <Bell className="w-4 h-4 text-brand-200" />
            <span>Quero ser avisado no lançamento VIP</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

      </div>
    </section>
  );
};
export default WhatsAppCommunityBanner;
