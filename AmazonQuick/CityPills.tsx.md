# File: CityPills.tsx
- **Original Path:** `frontend/src/components/CityPills.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 114

---

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

interface CityPillsProps {
  cities: string[];
  selectedCity: string;
  onSelectCity?: (city: string) => void;
  onlyNoExperience?: boolean;
  onToggleNoExperience?: () => void;
  onlyPcd?: boolean;
  onTogglePcd?: () => void;
  isSeoLanding?: boolean;
}

const CITY_SLUG_MAP: Record<string, string> = {
  'natal': '/vagas-natal',
  'parnamirim': '/vagas-parnamirim',
  'mossoró': '/vagas-mossoro',
  'mossoro': '/vagas-mossoro',
  'macaíba': '/vagas-macaiba',
  'macaiba': '/vagas-macaiba',
  'são gonçalo do amarante': '/vagas-sao-goncalo',
  'sao goncalo do amarante': '/vagas-sao-goncalo',
  'caicó': '/vagas-caico',
  'caico': '/vagas-caico',
  'currais novos': '/vagas-currais-novos',
  'ceará-mirim': '/vagas-ceara-mirim',
  'ceara-mirim': '/vagas-ceara-mirim',
  'assú': '/vagas-assu',
  'assu': '/vagas-assu',
  'açu': '/vagas-assu',
};

export const CityPills: React.FC<CityPillsProps> = ({ 
  cities, 
  selectedCity, 
  onSelectCity,
  onlyNoExperience,
  onToggleNoExperience,
  onlyPcd,
  onTogglePcd
}) => {
  return (
    <nav aria-label="Filtro rápido por cidade e categoria no RN" className="mb-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
          <MapPin className="w-3.5 h-3.5 text-brand-500" />
          Polos no RN:
        </span>

        {/* Link para todas as cidades */}
        <Link
          to="/"
          onClick={() => onSelectCity && onSelectCity('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            !selectedCity && !onlyNoExperience && !onlyPcd
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todas as Cidades
        </Link>

        {/* Filtro Especial: Vagas PcD */}
        <Link
          to={onlyPcd ? '/' : '/vagas-pcd-rn'}
          onClick={() => onTogglePcd && onTogglePcd()}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
            onlyPcd
              ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300'
          }`}
        >
          <span>♿ Vagas PcD</span>
        </Link>

        {/* Filtro Especial: Sem Experiência / Primeiro Emprego */}
        <Link
          to={onlyNoExperience ? '/' : '/vagas-sem-experiencia'}
          onClick={() => onToggleNoExperience && onToggleNoExperience()}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
            onlyNoExperience
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <span>🌱 Sem Experiência / 1º Emprego</span>
        </Link>

        {/* Polos regionais com links canônicos */}
        {cities.map((city) => {
          const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
          const targetUrl = CITY_SLUG_MAP[city.toLowerCase()] || '/';

          return (
            <Link
              key={city}
              to={isSelected ? '/' : targetUrl}
              onClick={() => onSelectCity && onSelectCity(isSelected ? '' : city)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {city}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

```
