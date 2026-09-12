# File: AuthModal.tsx
- **Original Path:** `frontend/src/components/AuthModal.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 278

---

```tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  title = 'Entrar no Natal Vagas',
  subtitle = 'Acesse sua conta para salvar currículos e desbloquear recursos Pro.',
  onSuccess
}) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Trava scroll da página e escuta tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Simula login de 1 clique do Google com credencial rápida
      const success = await loginWithGoogle('mock.google.credential');
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg('Não foi possível conectar com o Google. Tente com e-mail.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      let success = false;
      if (isRegister) {
        if (!name) {
          setErrorMsg('Informe seu nome completo.');
          setLoading(false);
          return;
        }
        success = await registerWithEmail(name, email, password);
      } else {
        success = await loginWithEmail(email, password);
      }

      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg('Credenciais inválidas. Tente novamente.');
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Botão Fechar Pinned */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer z-20"
          title="Fechar (Esc)"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo do Modal */}
        <div className="p-6 pb-2 text-center shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-xs">
            <Sparkles className="w-6 h-6 text-brand-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 pr-6 pl-6">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
        </div>

        <div className="p-6 pt-3 space-y-4 overflow-y-auto flex-1">
          
          {/* Botão Oficial Continuar com Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 font-bold text-sm shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"
          >
            {/* Logotipo SVG oficial Google */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continuar com o Google</span>
          </button>

          {/* Divisor */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ou com seu e-mail
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Formulário de E-mail */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Criar Minha Conta' : 'Entrar na Conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle entre Entrar e Cadastrar */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {isRegister ? (
              <span>
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                  className="text-brand-600 font-bold hover:underline cursor-pointer"
                >
                  Fazer Login
                </button>
              </span>
            ) : (
              <span>
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                  className="text-brand-600 font-bold hover:underline cursor-pointer"
                >
                  Criar conta grátis
                </button>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
export default AuthModal;

```
