import React from 'react';
import { PlusCircle, Search, Info, MessageSquare, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onOpenPostJob: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPostJob }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logotipo Oficial */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/assets/logo-natalvagas.jpg" 
              alt="Natal Vagas Logotipo" 
              className="h-14 w-auto object-contain rounded-md shadow-2xs transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <span className="block text-2xl font-black tracking-tight leading-none">
                <span className="text-brand-600">Natal</span>
                <span className="text-brand-400">Vagas</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-500">
                Sua oportunidade está aqui!
              </span>
            </div>
          </Link>

          {/* Links e Botão de Ação */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Vagas</span>
            </Link>

            <Link 
              to="/criar-curriculo" 
              className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-50/70 hover:bg-brand-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Criar Currículo</span>
              <span className="hidden sm:inline text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                Grátis
              </span>
            </Link>

            <Link 
              to="/sobre" 
              className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Sobre</span>
            </Link>

            <Link 
              to="/contato" 
              className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Contato</span>
            </Link>

            <button 
              onClick={onOpenPostJob}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Anunciar Vaga</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
