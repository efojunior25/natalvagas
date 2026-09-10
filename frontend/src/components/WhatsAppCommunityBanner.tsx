import React from 'react';
import { MessageCircle, Bell, ArrowRight, ShieldCheck } from 'lucide-react';

interface WhatsAppCommunityBannerProps {
  channelUrl?: string;
}

export const WhatsAppCommunityBanner: React.FC<WhatsAppCommunityBannerProps> = ({
  channelUrl = 'https://wa.me/5584992344922?text=Ol%C3%A1%2C+quero+entrar+no+grupo+VIP+de+vagas+do+Natal+Vagas'
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 shadow-lg shadow-emerald-900/10 border border-emerald-500/30">
      {/* Decoração de fundo sutil */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-2 right-12 opacity-10">
        <MessageCircle className="w-36 h-36" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold tracking-wide uppercase mb-3">
            <Bell className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            <span>Alertas em Primeira Mão</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Receba as novas vagas de Natal e Região no seu WhatsApp
          </h3>

          <p className="text-sm text-emerald-50 mt-2 leading-relaxed">
            Não perca prazos de candidatura! Seja notificado instantaneamente quando surgirem vagas no Alecrim, Ponta Negra, Parnamirim e grande Natal.
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-emerald-100/90 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> 100% Gratuito
            </span>
            <span>•</span>
            <span>Sem spam, apenas vagas verificadas</span>
          </div>
        </div>

        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 active:scale-98 font-bold text-sm rounded-2xl shadow-md transition-all group cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
          <span>Entrar no Grupo VIP</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
};
export default WhatsAppCommunityBanner;
