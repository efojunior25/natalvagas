import React from 'react';
import { MapPin } from 'lucide-react';

interface CityPillsProps {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onlyNoExperience?: boolean;
  onToggleNoExperience?: () => void;
}

export const CityPills: React.FC<CityPillsProps> = ({ 
  cities, 
  selectedCity, 
  onSelectCity,
  onlyNoExperience,
  onToggleNoExperience
}) => {
  return (
    <nav aria-label="Filtro rápido por cidade" className="mb-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
          <MapPin className="w-3.5 h-3.5 text-brand-500" />
          Polos no RN:
        </span>

        <button
          type="button"
          onClick={() => onSelectCity('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            !selectedCity
              ? 'bg-brand-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todas as Cidades
        </button>

        {/* Filtro Especial: Sem Experiência / Primeiro Emprego */}
        {onToggleNoExperience && (
          <button
            type="button"
            onClick={onToggleNoExperience}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              onlyNoExperience
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
            }`}
          >
            <span>🌱 Sem Experiência / 1º Emprego</span>
          </button>
        )}

        {cities.map((city) => {
          const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
          return (
            <button
              key={city}
              type="button"
              onClick={() => onSelectCity(isSelected ? '' : city)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
