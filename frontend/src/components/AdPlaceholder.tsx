import React from 'react';

interface AdPlaceholderProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle';
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ 
  format = 'horizontal', 
  className = '' 
}) => {
  return (
    <div className={`my-6 flex flex-col items-center justify-center overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
        Publicidade
      </span>
      <div className={`w-full max-w-4xl bg-slate-100/70 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-4 text-center transition-all ${
        format === 'horizontal' ? 'min-h-[100px]' : 'min-h-[250px]'
      }`}>
        <div className="text-xs text-slate-400">
          <p className="font-semibold text-slate-500">Espaço Reservado para Google AdSense</p>
          <p className="text-[11px] mt-0.5">Formato Responsivo ({format === 'horizontal' ? '728x90 / 320x100' : '300x250'})</p>
        </div>
      </div>
    </div>
  );
};
