import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle, Search, Info, MessageSquare, FileText, Menu, X, ShieldCheck, LogIn, LogOut, User, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onOpenPostJob: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPostJob }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  // Fecha o menu móvel ao mudar de página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Trava a rolagem da página quando o menu estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleOpenPostJobMobile = () => {
    setIsMobileMenuOpen(false);
    onOpenPostJob();
  };

  const handleAuthMobile = () => {
    setIsMobileMenuOpen(false);
    setIsAuthOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logotipo Oficial Limpo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img 
              src="/assets/logo-natalvagas.jpg" 
              alt="Natal Vagas Logotipo" 
              className="h-10 sm:h-12 w-auto object-contain rounded-md shadow-2xs transition-transform group-hover:scale-105"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
              <span className="text-brand-600">Natal</span>
              <span className="text-brand-400">Vagas</span>
            </span>
          </Link>

          {/* Versão Desktop Minimalista (telas >= md) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link 
                to="/" 
                className={`transition-colors hover:text-brand-600 ${
                  location.pathname === '/' ? 'text-brand-600 font-bold' : ''
                }`}
              >
                Vagas
              </Link>

              <Link 
                to="/criar-curriculo" 
                className={`transition-colors hover:text-brand-600 ${
                  location.pathname === '/criar-curriculo' ? 'text-brand-600 font-bold' : ''
                }`}
              >
                Criar Currículo
              </Link>

              <Link 
                to="/blog" 
                className={`transition-colors hover:text-brand-600 ${
                  location.pathname.startsWith('/blog') ? 'text-brand-600 font-bold' : ''
                }`}
              >
                Blog
              </Link>

              <Link 
                to="/sobre" 
                className={`transition-colors hover:text-brand-600 ${
                  location.pathname === '/sobre' ? 'text-brand-600 font-bold' : ''
                }`}
              >
                Sobre
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {/* Status do Usuário / Botão Entrar */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    <span className="max-w-[100px] truncate">{user?.name}</span>
                    {user?.isPro && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1 py-0.5 rounded-sm">PRO</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer flex items-center gap-1"
                    title="Sair da conta"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors cursor-pointer"
                >
                  Entrar
                </button>
              )}

              <button 
                onClick={onOpenPostJob}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Anunciar Vaga</span>
              </button>
            </div>
          </div>

          {/* Versão Mobile (telas < md) - Ações Rápidas & Hambúrguer */}
          <div className="flex md:hidden items-center gap-2">
            <Link 
              to="/criar-curriculo" 
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200"
            >
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              <span>Currículo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Drawer Mobile (Renderizado via Portal direto no Body) */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop escurecido */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Painel do Menu */}
          <div className="fixed inset-y-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[101] flex flex-col justify-between p-6 overflow-y-auto transition-transform">
            
            <div className="space-y-6">
              {/* Topo da Gaveta */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="/assets/logo-natalvagas.jpg" 
                    alt="Natal Vagas" 
                    className="h-9 w-auto rounded object-contain"
                  />
                  <div>
                    <span className="text-lg font-black text-slate-900 block leading-none">
                      <span className="text-brand-600">Natal</span>
                      <span className="text-brand-400">Vagas</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Menu Principal</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card de Usuário / Login no Mobile */}
              {isAuthenticated ? (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate">{user?.name}</span>
                        {user?.isPro && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">PRO</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">{user?.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAuthMobile}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-brand-600" />
                  <span>Entrar / Criar Conta</span>
                </button>
              )}

              {/* Links de Navegação */}
              <nav className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-slate-800 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-colors"
                >
                  <Search className="w-4 h-4 text-brand-500" />
                  <span>Vagas de Emprego em Natal e RN</span>
                </Link>

                <Link
                  to="/criar-curriculo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-brand-600 bg-brand-50/50 hover:bg-brand-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <span>Criar Currículo com IA</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase font-extrabold">
                    Grátis
                  </span>
                </Link>

                <Link
                  to="/blog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-slate-800 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-brand-500" />
                  <span>Blog & Notícias de Emprego</span>
                </Link>

                <Link
                  to="/sobre"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-slate-800 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-colors"
                >
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Sobre o Natal Vagas</span>
                </Link>

                <Link
                  to="/dicas-seguranca"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-slate-800 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Dicas Anti-Golpe & Segurança</span>
                </Link>

                <Link
                  to="/contato"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-slate-800 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Fale Conosco / WhatsApp</span>
                </Link>
              </nav>

              {/* Botão de Anunciar Vaga Destacado */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenPostJobMobile}
                  className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Anunciar Vaga Gratuitamente</span>
                </button>
              </div>
            </div>

            {/* Rodapé da Gaveta */}
            <div className="pt-6 border-t border-slate-100 text-center space-y-2">
              <p className="text-[11px] text-slate-400">
                Suporte WhatsApp: <strong className="text-slate-600">(84) 99234-4922</strong>
              </p>
              <p className="text-[10px] text-slate-400">
                © {new Date().getFullYear()} NatalVagas.com.br
              </p>
            </div>

          </div>
        </div>,
        document.body
      )}
      </header>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </>
  );
};
