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
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-surface-lightBg py-12 md:py-16 border-b border-slate-200">
      
      {/* Elemento Decorativo Sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Badge Regional */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-6 border border-brand-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Vagas de Emprego em Natal e no Rio Grande do Norte
        </div>

        {/* Headline Principal Otimizada para SEO */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Vagas de Emprego em Natal <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
            e no Rio Grande do Norte
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Encontre oportunidades de trabalho, estágio e jovem aprendiz em Natal, Mossoró, Parnamirim e região, com fontes verificadas e candidatura direta na empresa.
        </p>

        {/* Barra de Pesquisa de Alta Conversão */}
        <form 
          onSubmit={handleSubmit}
          className="mt-8 p-2.5 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto"
        >
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-100 focus-within:border-brand-500 focus-within:bg-white transition-all">
            <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              aria-label="Buscar por cargo, função ou empresa"
              placeholder="Cargo, função ou empresa (ex: Atendente, Vendedor, Estágio)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="sm:w-56 flex items-center gap-2.5 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-100 focus-within:border-brand-500 focus-within:bg-white transition-all">
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/25 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Buscar Vagas</span>
          </button>
        </form>

        {/* Termos Mais Buscados */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="font-medium text-slate-600">Mais buscados no RN:</span>
          {['Auxiliar Administrativo', 'Atendente', 'Vendedor', 'Jovem Aprendiz', 'Estágio', 'Parnamirim', 'Mossoró'].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQuery(term);
                onSearch(term, city);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
