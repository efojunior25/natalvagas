import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdPlaceholderProps {
  slotId?: string;
  clientId?: string;
  format?: 'horizontal' | 'rectangle' | 'in-feed';
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ 
  slotId,
  clientId,
  className = '' 
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isRequested = useRef(false);
  const [adStatus, setAdStatus] = useState<'pending' | 'filled' | 'unfilled'>('pending');

  // ID oficial do cliente Google AdSense e Slot
  const activeClientId = clientId || (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined) || 'ca-pub-7415792754049263';
  const activeSlotId = slotId || (import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined) || '6681954183';

  // 1. Se não houver slotId configurado (ex: aguardando liberação de blocos pelo Google), NÃO renderiza nada no DOM
  if (!activeSlotId) {
    return null;
  }

  // 2. Se o Google respondeu com 'unfilled' (sem anúncio disponível ou conta em aprovação), oculta 100%
  if (adStatus === 'unfilled') {
    return null;
  }

  useEffect(() => {
    const el = adRef.current;
    if (!el || !activeClientId || !activeSlotId) return;

    // Observa o status do anúncio retornado pelos servidores do Google
    const observer = new MutationObserver(() => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setAdStatus('unfilled');
      } else if (status === 'filled') {
        setAdStatus('filled');
      }
    });

    observer.observe(el, { 
      attributes: true, 
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'] 
    });

    // Dispara a requisição do bloco para o Google AdSense
    if (!isRequested.current) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isRequested.current = true;
        }
      } catch (err) {
        console.warn('[AdSense] push ignorado:', err);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [activeClientId, activeSlotId]);

  return (
    <div 
      className={`w-full flex flex-col items-center justify-center transition-all duration-300 ${
        adStatus === 'filled' ? 'my-6 opacity-100' : 'h-0 m-0 p-0 opacity-0 overflow-hidden'
      } ${className}`}
    >
      {adStatus === 'filled' && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
          Publicidade
        </span>
      )}

      <ins
        ref={adRef}
        className="adsbygoogle w-full"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={activeClientId}
        data-ad-slot={activeSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
