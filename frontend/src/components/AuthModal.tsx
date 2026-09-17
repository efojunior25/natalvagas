import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Mail, Lock, User, ArrowRight, Loader2, Sparkles, 
  ShieldCheck, QrCode, Copy, Check, ArrowLeft 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth, isDeveloperEmail } from '../context/AuthContext';
import { formatSecretKey } from '../services/totpService';

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
  const { loginWithEmail, registerWithEmail, resetMfaSecret } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Estados de Verificação e Configuração de MFA (2FA)
  const [mfaCode, setMfaCode] = useState<string>('');
  const [requiresMfa, setRequiresMfa] = useState<boolean>(false);
  const [requiresMfaSetup, setRequiresMfaSetup] = useState<boolean>(false);
  const [mfaSecret, setMfaSecret] = useState<string>('');
  const [otpauthUri, setOtpauthUri] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

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

  // Reseta estados temporários ao fechar
  useEffect(() => {
    if (!isOpen) {
      setRequiresMfa(false);
      setRequiresMfaSetup(false);
      setMfaCode('');
      setMfaSecret('');
      setOtpauthUri('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isDev = isDeveloperEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    if ((requiresMfa || requiresMfaSetup) && (!mfaCode || mfaCode.length < 6)) {
      setErrorMsg('Digite o código de 6 dígitos gerado pelo aplicativo autenticador.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!name) {
          setErrorMsg('Informe seu nome completo.');
          setLoading(false);
          return;
        }
        const res = await registerWithEmail(name, email, password);
        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setErrorMsg(res.message || 'Erro ao criar conta.');
        }
      } else {
        const res = await loginWithEmail(email, password, mfaCode, mfaSecret);

        // Caso 1: Primeiro login do Desenvolvedor -> Exige configuração do MFA com QR Code
        if (res.requiresMfaSetup) {
          setRequiresMfaSetup(true);
          setRequiresMfa(false);
          if (res.mfaSecret) setMfaSecret(res.mfaSecret);
          if (res.otpauthUri) setOtpauthUri(res.otpauthUri);
          setErrorMsg('');
        }
        // Caso 2: Login subsequente -> Exige código MFA já cadastrado
        else if (res.requiresMfa) {
          setRequiresMfa(true);
          setRequiresMfaSetup(false);
          setErrorMsg('');
        }
        // Caso 3: Login concluído com sucesso
        else if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setErrorMsg(res.message || 'Credenciais inválidas. Tente novamente.');
        }
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleResetMfa = () => {
    resetMfaSecret(email);
    setRequiresMfa(false);
    setRequiresMfaSetup(false);
    setMfaCode('');
    setMfaSecret('');
    setOtpauthUri('');
    setErrorMsg('MFA reiniciado. Clique em entrar novamente para configurar.');
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

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* MENSAGEM DE ERRO OU ALERTA */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* VISTA 1: CONFIGURAÇÃO DE MFA NO PRIMEIRO ACESSO (QR CODE + CHAVE) */}
          {requiresMfaSetup && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mb-1 shadow-xs">
                  <QrCode className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Configurar Autenticador (MFA)
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Primeiro acesso de Desenvolvedor. Escaneie o QR Code abaixo no <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>1Password</strong>:
                </p>
              </div>

              {/* QR Code Imagem */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-44 h-44 rounded-xl bg-white p-2 border border-slate-200 shadow-xs flex items-center justify-center">
                  <QRCodeSVG
                    value={otpauthUri || 'otpauth://totp/NatalVagas?secret=JBSWY3DPEHPK3PXP'}
                    size={160}
                    level="M"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-medium text-center">
                  Conta vinculada: <strong className="text-slate-800">{email}</strong>
                </span>
              </div>

              {/* Chave de Entrada Manual */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chave Manual</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs font-black text-slate-900 tracking-wider select-all break-all">
                  {formatSecretKey(mfaSecret)}
                </p>
              </div>

              {/* Formulário de Confirmação do Código */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Digite o código de 6 dígitos exibido no aplicativo para confirmar:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    className="w-full text-center tracking-widest text-2xl font-mono py-2.5 rounded-xl border-2 border-brand-500 focus:outline-none shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar e Ativar Modo Admin</span>}
                </button>

                <button
                  type="button"
                  onClick={() => { setRequiresMfaSetup(false); setMfaCode(''); }}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 text-center py-1 cursor-pointer flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para login</span>
                </button>
              </form>
            </div>
          )}

          {/* VISTA 2: VERIFICAÇÃO DE MFA EM LOGINS SUBSEQUENTES */}
          {requiresMfa && !requiresMfaSetup && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-1 shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Verificação em Duas Etapas (MFA)
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Digite o código de 6 dígitos gerado pelo aplicativo autenticador no seu celular para <strong>{email}</strong>:
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 text-center">
                    Código de 6 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    className="w-full text-center tracking-widest text-2xl font-mono py-3 rounded-xl border-2 border-brand-500 focus:outline-none shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Entrar no Modo Administrador</span>}
                </button>

                <div className="pt-2 flex flex-col items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResetMfa}
                    className="text-amber-600 hover:underline font-semibold cursor-pointer"
                  >
                    Trocou de aparelho? Reconfigurar autenticador
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRequiresMfa(false); setMfaCode(''); }}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para login</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VISTA 3: FORMULÁRIO PADRÃO DE LOGIN / CADASTRO */}
          {!requiresMfa && !requiresMfaSetup && (
            <>
              {/* Topo do Modal */}
              <div className="text-center shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-2 shadow-xs">
                  <Sparkles className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {isRegister ? 'Criar Conta Gratuita' : title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {isRegister 
                    ? 'Cadastre-se para salvar currículos na nuvem e acompanhar vagas.' 
                    : subtitle}
                </p>
              </div>

              {/* Indicador de Desenvolvedor */}
              {isDev && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Conta de Desenvolvedor da Página detectada</span>
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
                      <span>{isRegister ? 'Criar Minha Conta' : (isDev ? 'Continuar para Verificação MFA' : 'Entrar na Conta')}</span>
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
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
export default AuthModal;
