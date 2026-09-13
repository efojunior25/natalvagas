import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Briefcase, MapPin, Sparkles } from 'lucide-react';
import { SeoLandingConfig } from '../data/seoLandingPages';

interface SeoCategoryHeroProps {
  config: SeoLandingConfig;
  totalMatchingJobs: number;
}

export const SeoCategoryHero: React.FC<SeoCategoryHeroProps> = ({ config, totalMatchingJobs }) => {
  return (
    <section className="bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-brand-600/30">
      {/* Elementos visuais de fundo sutis */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Breadcrumb de Navegação Estruturada */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center flex-wrap gap-1.5 text-xs text-brand-200">
            <li>
              <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
                Início
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-brand-300/70" /></li>
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Vagas no RN
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-brand-300/70" /></li>
            <li className="font-semibold text-white">
              {config.city ? `Vagas em ${config.city}` : config.h1}
            </li>
          </ol>
        </nav>

        {/* Badge e Identificador do Polo/Categoria */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-sm border border-white/20 mb-3 shadow-xs">
          {config.city ? <MapPin className="w-3.5 h-3.5 text-emerald-300" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
          <span>{config.badge}</span>
        </div>

        {/* H1 Principal Otimizado para SEO */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-3">
          {config.h1}
        </h1>

        {/* Texto descritivo e contextual */}
        <p className="text-sm sm:text-base text-brand-100 max-w-3xl leading-relaxed mb-5">
          {config.introText}
        </p>

        {/* Barra de Status e Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-100">
            <Briefcase className="w-4 h-4 text-emerald-300" />
            <span>
              <strong className="text-white text-base">{totalMatchingJobs}</strong> vagas encontradas neste filtro
            </span>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 text-white text-xs font-bold transition-all border border-white/20 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver todas as vagas do RN</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
