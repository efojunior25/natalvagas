# File: CookieConsentBanner.tsx
- **Original Path:** `frontend/src/components/CookieConsentBanner.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 92

---

```tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'natalvagas_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Verifica se o usuário já registrou sua preferência
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Pequeno delay para entrada suave na tela
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Consentimento de Cookies"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-5 text-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
            <Cookie className="w-5 h-5 shrink-0 text-amber-500" />
            <span>Valorizamos sua privacidade</span>
          </div>
          <button 
            onClick={handleAcceptNecessary}
            aria-label="Fechar aviso de cookies"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
          Utilizamos cookies essenciais para o funcionamento do portal e tecnologias de publicidade (Google AdSense) e métricas para oferecer vagas relevantes em Natal/RN. Veja nossa{' '}
          <Link to="/politica-de-privacidade" className="text-brand-600 hover:underline font-semibold">
            Política de Privacidade
          </Link>.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
          >
            Aceitar Todos
          </button>
          <button
            onClick={handleAcceptNecessary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Apenas Necessários
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Em total conformidade com a LGPD (Lei nº 13.709/2018)</span>
        </div>
      </div>
    </aside>
  );
};
export default CookieConsentBanner;

```
