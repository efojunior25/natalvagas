import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Ticket, Copy, Check, Sparkles, RefreshCw, LogOut, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CouponItem {
  code: string;
  discountPercent: number;
  used: boolean;
  createdAt: string;
  candidate?: string;
  usedAt?: string | null;
  usedBy?: string | null;
}

const STORAGE_KEY = 'natalvagas_admin_pin';

export const AdminCoupons: React.FC = () => {
  const [pin, setPin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [tempPin, setTempPin] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  
  // Criação de cupom
  const [candidateName, setCandidateName] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastCreated, setLastCreated] = useState<{ code: string; message: string; whatsappMessage: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Lista de cupons
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string>('');

  // Testa autorização ao carregar se já tiver PIN salvo
  useEffect(() => {
    if (pin) {
      loadCoupons(pin);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = tempPin.trim();
    if (!cleanPin) {
      setAuthError('Digite a chave de acesso administrativo.');
      return;
    }
    setPin(cleanPin);
    loadCoupons(cleanPin);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setPin('');
    setIsAuthorized(false);
    setCoupons([]);
    setLastCreated(null);
  };

  const loadCoupons = async (authPin: string) => {
    setIsLoadingList(true);
    setListError('');
    try {
      const res = await fetch(`/api/coupons/list?pin=${encodeURIComponent(authPin)}`, {
        headers: { Authorization: `Bearer ${authPin}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsAuthorized(true);
        setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
        try {
          localStorage.setItem(STORAGE_KEY, authPin);
        } catch {}
      } else {
        setIsAuthorized(false);
        setAuthError(data.message || 'Chave de acesso incorreta.');
      }
    } catch (err) {
      setListError('Erro ao carregar lista de cupons.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLastCreated(null);
    setCopiedCode(false);
    setCopiedMessage(false);

    try {
      const res = await fetch('/api/coupons/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pin}`
        },
        body: JSON.stringify({
          adminKey: pin,
          candidate: candidateName || 'Candidato PcD (WhatsApp)',
          customCode: customCode || undefined,
          discountPercent: 50
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setLastCreated({
          code: data.coupon.code,
          message: data.message,
          whatsappMessage: data.whatsappMessage
        });
        setCandidateName('');
        setCustomCode('');
        // Atualiza a lista
        loadCoupons(pin);
      } else {
        alert(data.message || 'Erro ao gerar cupom.');
      }
    } catch (err) {
      alert('Erro de conexão ao gerar cupom.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!lastCreated) return;
    navigator.clipboard.writeText(lastCreated.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyMessage = () => {
    if (!lastCreated) return;
    navigator.clipboard.writeText(lastCreated.whatsappMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-3 sm:p-6">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors font-bold text-sm">
          <span>← Voltar ao Natal Vagas</span>
        </Link>
        {isAuthorized && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl">
        {/* Banner de Título */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-slate-800 p-5 rounded-3xl shadow-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Painel de Cupons PcD</h1>
              <p className="text-xs text-brand-100 font-medium">Geração e controle de cupons de uso único de 50% de desconto</p>
            </div>
          </div>
        </div>

        {/* Tela de Login se não autorizado */}
        {!isAuthorized ? (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Autenticação do Administrador</h2>
            <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
              Digite a chave de acesso ou PIN administrativo do Natal Vagas para acessar a geração de cupons.
            </p>

            <form onSubmit={handleLogin} className="max-w-sm mx-auto space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="PIN / Chave de Acesso"
                  value={tempPin}
                  onChange={(e) => {
                    setTempPin(e.target.value);
                    setAuthError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-center font-mono tracking-widest text-sm"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="text-xs text-red-400 flex items-center justify-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-98 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-600/30 cursor-pointer"
              >
                Acessar Painel
              </button>
            </form>
          </div>
        ) : (
          /* Painel do Administrador Autenticado */
          <div className="space-y-6">
            {/* Card de Criação */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Gerar Novo Cupom de Uso Único (50% OFF)</h2>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Identificação do Candidato (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva (WhatsApp)"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Código Personalizado (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Vazio = Gerar PCD-XXXX automático"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Gerando Código Exclusivo...' : '⚡ Gerar Cupom PcD 50% (Uso Único)'}</span>
                </button>
              </form>

              {/* Resultado do Último Cupom Gerado */}
              {lastCreated && (
                <div className="mt-5 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cupom Gerado com Sucesso!</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-emerald-500/20 mb-3">
                    <div className="text-center sm:text-left">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Código Exclusivo:</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono tracking-wider">{lastCreated.code}</span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedMessage ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMessage ? 'Mensagem Copiada!' : '📋 Copiar p/ WhatsApp'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-300 font-medium">
                    💡 Clique em <strong>"📋 Copiar p/ WhatsApp"</strong> e cole diretamente na conversa do candidato para enviar a mensagem formatada.
                  </p>
                </div>
              )}
            </div>

            {/* Lista e Histórico de Cupons */}
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">Histórico de Cupons Criados ({coupons.length})</h3>
                </div>

                <button
                  type="button"
                  onClick={() => loadCoupons(pin)}
                  disabled={isLoadingList}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-xs transition-colors cursor-pointer"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {listError && (
                <div className="text-xs text-red-400 mb-3">{listError}</div>
              )}

              {coupons.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {isLoadingList ? 'Carregando cupons...' : 'Nenhum cupom gerado ainda. Clique em "Gerar Cupom PcD" acima.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60 max-h-80 overflow-y-auto pr-1">
                  {coupons.map((c) => (
                    <div key={c.code} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{c.code}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {c.discountPercent}% OFF
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {c.candidate || 'Candidato'} • Criado em {new Date(c.createdAt).toLocaleDateString('pt-BR')} às {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div>
                        {c.used ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              <span>🔴 Já Utilizado</span>
                            </span>
                            {c.usedBy && (
                              <div className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate" title={c.usedBy}>
                                por {c.usedBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span>🟢 Disponível</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminCoupons;
