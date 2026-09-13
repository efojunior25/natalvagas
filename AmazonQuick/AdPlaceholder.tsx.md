# File: AdPlaceholder.tsx
- **Original Path:** `frontend/src/components/AdPlaceholder.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 70

---

```tsx
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdPlaceholderProps {
  slotId?: string;
  clientId?: string;
  format?: 'horizontal' | 'rectangle';
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ 
  slotId,
  clientId,
  format = 'horizontal', 
  className = '' 
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isLoaded = useRef(false);

  // ID oficial do cliente Google AdSense
  const activeClientId = clientId || (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined) || 'ca-pub-7415792754049263';
  const activeSlotId = slotId || (import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined);

  useEffect(() => {
    if (activeClientId && activeSlotId && adRef.current && !isLoaded.current) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (err) {
        console.warn('[AdSense] push ignorado:', err);
      }
    }
  }, [activeClientId, activeSlotId]);

  return (
    <div className={`my-6 flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
        Publicidade
      </span>

      {activeClientId && activeSlotId ? (
        <ins
          ref={adRef}
          className="adsbygoogle w-full"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-client={activeClientId}
          data-ad-slot={activeSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className={`w-full max-w-4xl bg-slate-100/70 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-4 text-center transition-all ${
          format === 'horizontal' ? 'min-h-[100px]' : 'min-h-[250px]'
        }`}>
          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-500">Espaço Reservado para Google AdSense</p>
            <p className="text-[11px] mt-0.5">Formato Responsivo ({format === 'horizontal' ? '728x90 / 320x100' : '300x250'})</p>
          </div>
        </div>
      )}
    </div>
  );
};

```
