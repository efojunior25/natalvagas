# File: Footer.tsx
- **Original Path:** `frontend/src/components/Footer.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 136

---

```tsx
import React from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 pt-8 pb-6 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-4">
          
          {/* Coluna 1: Sobre */}
          <div>
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo-natalvagas.jpg" 
                alt="Natal Vagas" 
                className="h-10 w-auto rounded object-contain bg-slate-100 dark:bg-white p-0.5 border border-slate-200 dark:border-transparent" 
              />
              <span className="text-xl font-black text-slate-900 dark:text-white">
                <span className="text-brand-600 dark:text-brand-400">Natal</span>Vagas
              </span>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              O maior portal de empregos em Natal e no RN. Mais de 1.400 vagas verificadas e atualizadas diariamente de forma 100% gratuita.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-600 dark:text-brand-300">
              <MapPin className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0" />
              <span>Natal, Rio Grande do Norte — Brasil</span>
            </div>
          </div>

          {/* Coluna 2: Navegação & Ferramentas */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Navegação
            </h3>
            <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Todas as Vagas</Link></li>
              <li><Link to="/criar-curriculo" className="hover:text-brand-600 dark:hover:text-brand-400 text-brand-600 dark:text-brand-300 font-semibold transition-colors flex items-center gap-1">Criar Currículo <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1 rounded-sm border border-emerald-200 dark:border-emerald-800/40">Grátis</span></Link></li>
              <li><Link to="/blog" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Blog & Notícias de Emprego</Link></li>
              <li><Link to="/sobre" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Sobre o Natal Vagas</Link></li>
              <li><Link to="/contato" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Fale Conosco</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Institucional & Conformidade AdSense */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Institucional & Legal
            </h3>
            <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/politica-de-privacidade" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Termos de Uso</Link></li>
              <li><Link to="/dicas-seguranca" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Segurança do Candidato</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Redes Sociais & Comunidades Oficiais */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Canais Oficiais
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Acompanhe novidades e vagas diárias:
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              {/* WhatsApp */}
              <a 
                href="https://wa.me/5584992344922" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="WhatsApp Oficial"
                aria-label="WhatsApp Oficial"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 hover:bg-emerald-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white flex items-center justify-center transition-all shadow-xs hover:scale-105 group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.09-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/>
                </svg>
              </a>

              {/* Telegram */}
              <a 
                href="https://t.me/natalvagas" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Canal Telegram"
                aria-label="Canal Telegram"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-sky-400 hover:bg-sky-500 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white flex items-center justify-center transition-all shadow-xs hover:scale-105 group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/natalvagas.com.br" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Instagram Oficial"
                aria-label="Instagram Oficial"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-pink-500 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-600 hover:to-purple-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white flex items-center justify-center transition-all shadow-xs hover:scale-105 group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a 
                href="https://facebook.com/natalvagas" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Página Facebook"
                aria-label="Página Facebook"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500 hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white flex items-center justify-center transition-all shadow-xs hover:scale-105 group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Direitos Autorais Centralizados */}
        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} NatalVagas.com.br — Todos os direitos reservados.</p>
        </div>

      </div>
    </footer>
  );
};

```
