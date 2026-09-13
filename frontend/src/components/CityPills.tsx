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
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
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
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
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
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-800/60'
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
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800/60'
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
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
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
