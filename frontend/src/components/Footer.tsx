import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Coluna 1: Sobre */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo-natalvagas.jpg" 
                alt="Natal Vagas" 
                className="h-10 w-auto rounded object-contain bg-white p-0.5"
              />
              <span className="text-xl font-black text-white">
                <span className="text-brand-400">Natal</span>Vagas
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-400 max-w-sm leading-relaxed">
              O portal líder em oportunidades de emprego em Natal e toda a Região Metropolitana (Parnamirim, Macaíba, São Gonçalo). Conectamos candidatos a empresas de forma 100% gratuita.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-300">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>Natal, Rio Grande do Norte — Brasil</span>
            </div>
          </div>

          {/* Coluna 2: Navegação & Ferramentas */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Navegação
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Todas as Vagas</Link></li>
              <li><Link to="/criar-curriculo" className="hover:text-brand-400 text-brand-300 font-semibold transition-colors flex items-center gap-1">Criar Currículo <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded-sm">Grátis</span></Link></li>
              <li><Link to="/sobre" className="hover:text-brand-400 transition-colors">Sobre o Natal Vagas</Link></li>
              <li><Link to="/dicas-seguranca" className="hover:text-brand-400 transition-colors">Dicas Anti-Golpe</Link></li>
              <li><Link to="/contato" className="hover:text-brand-400 transition-colors">Fale Conosco / Contato</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Institucional & Conformidade AdSense */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Institucional & Legal
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li><Link to="/politica-de-privacidade" className="hover:text-brand-400 transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-brand-400 transition-colors">Termos de Uso</Link></li>
              <li><Link to="/dicas-seguranca" className="hover:text-brand-400 transition-colors">Segurança do Candidato</Link></li>
              <li><Link to="/contato" className="hover:text-brand-400 transition-colors">Reportar Vaga / Suporte</Link></li>
            </ul>
          </div>

        </div>

        {/* Alerta de Segurança e Direitos Autorais */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/50">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Atenção: O Natal Vagas é 100% gratuito. Nunca pague por cursos ou processos seletivos!</span>
          </div>
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} NatalVagas.com.br — Todos os direitos reservados.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
