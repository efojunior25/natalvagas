# File: HeroBanner.tsx
- **Original Path:** `frontend/src/components/HeroBanner.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 104

---

```tsx
import React, { useState } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';

interface HeroBannerProps {
  onSearch: (query: string, city: string) => void;
  cities: string[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSearch, cities }) => {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, city);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-surface-lightBg py-8 sm:py-12 md:py-16 border-b border-slate-200">
      
      {/* Elemento Decorativo Sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Badge Regional */}
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-brand-100 text-brand-700 text-[11px] sm:text-xs font-semibold mb-4 sm:mb-6 border border-brand-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shrink-0" />
          <span className="truncate">Vagas em Natal e no Rio Grande do Norte</span>
        </div>

        {/* Headline Principal Otimizada para SEO e Mobile */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-snug sm:leading-tight">
          Vagas de Emprego em Natal <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
            e no Rio Grande do Norte
          </span>
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Encontre vagas de trabalho, estágio e jovem aprendiz em Natal, Mossoró, Parnamirim e região, com fontes verificadas e candidatura direta.
        </p>

        {/* Barra de Pesquisa de Alta Conversão */}
        <form 
          onSubmit={handleSubmit}
          className="mt-6 sm:mt-8 p-2 sm:p-2.5 bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto"
        >
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 bg-slate-50/80 rounded-xl border border-slate-100 focus-within:border-brand-500 focus-within:bg-white transition-all">
            <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              aria-label="Buscar por cargo, função ou empresa"
              placeholder="Cargo, função ou empresa (ex: Atendente, Vendedor)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="sm:w-56 flex items-center gap-2.5 px-3 py-2.5 bg-slate-50/80 rounded-xl border border-slate-100 focus-within:border-brand-500 focus-within:bg-white transition-all">
            <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
            <select 
              aria-label="Filtrar por cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">Todas as Cidades</option>
              {cities.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <button 
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/25 transition-all cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Buscar Vagas</span>
          </button>
        </form>

        {/* Termos Mais Buscados - Rolagem Suave no Mobile */}
        <div className="mt-4 sm:mt-5 w-full flex items-center justify-start sm:justify-center gap-2 text-xs text-slate-500 overflow-x-auto no-scrollbar py-1 px-1">
          <span className="font-semibold text-slate-600 shrink-0">Mais buscados:</span>
          {['Auxiliar Administrativo', 'Atendente', 'Vendedor', 'Jovem Aprendiz', 'Estágio', 'Parnamirim', 'Mossoró'].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQuery(term);
                onSearch(term, city);
              }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 active:scale-95 transition-all cursor-pointer text-xs font-medium border border-slate-200/80"
            >
              {term}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};

```
