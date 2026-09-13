# File: ThemeToggle.tsx
- **Original Path:** `frontend/src/components/ThemeToggle.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 41

---

```tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-500 active:scale-95 ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 shadow-inner'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs'
      } ${className}`}
      title={isDark ? 'Mudar para Modo Claro (Sol)' : 'Mudar para Modo Escuro (Lua)'}
      aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-180 duration-300 fill-amber-400/20" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 animate-in spin-in-180 duration-300 fill-indigo-600/10" />
        )}
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-bold">
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
};
export default ThemeToggle;

```
