# File: JobCard.tsx
- **Original Path:** `frontend/src/components/JobCard.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 127

---

```tsx
import React from 'react';
import { MapPin, Building2, Clock, DollarSign, ArrowUpRight, Share2, Sparkles } from 'lucide-react';
import { Job } from '../types/job';

interface JobCardProps {
  job: Job;
  onApply: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Confira esta vaga em Natal/RN: *${job.title}* na empresa *${job.companyName}*\n\nAcesse: https://natalvagas.com.br/vaga/${job.slug}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <article 
      onClick={() => onApply(job)}
      className={`group relative rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between border ${
        job.isFeatured
          ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 via-white to-white hover:border-amber-400'
          : 'bg-white border-slate-200/90 hover:border-brand-300 hover:shadow-slate-200/50'
      }`}
    >
      <div>
        {/* Selo Vaga em Destaque (Se contratado) */}
        {job.isFeatured && (
          <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-400 animate-pulse shrink-0" />
            <span>VAGA EM DESTAQUE VIP</span>
          </div>
        )}

        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-base sm:text-lg uppercase shrink-0 overflow-hidden group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors mt-0.5">
              {job.companyLogoUrl ? (
                <img 
                  src={job.companyLogoUrl} 
                  alt={`Logotipo da empresa ${job.companyName}`} 
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">
                {job.companyName}
              </span>
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug break-words">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Botão Compartilhar WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            title={`Compartilhar vaga de ${job.title} no WhatsApp`}
            aria-label={`Compartilhar vaga de ${job.title} no WhatsApp`}
            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Localização e Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              {job.neighborhood ? `${job.neighborhood}, ${job.city}` : `${job.city}/RN`}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 font-medium border border-brand-100">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-500 shrink-0" />
            <span>{job.contractType === 'NAO_INFORMADO' ? 'Regime N/I' : job.contractType} • {job.workModel === 'NAO_INFORMADO' ? 'N/I' : job.workModel}</span>
          </span>

          {!job.hideSalary && job.salaryMin && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
              <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
              <span>
                R$ {job.salaryMin.toLocaleString('pt-BR')}
                {job.salaryMax ? ` - R$ ${job.salaryMax.toLocaleString('pt-BR')}` : ''}
              </span>
            </span>
          )}

          {/* Selo Sem Experiência / 1º Emprego se aplicável */}
          {(job.contractType === 'ESTAGIO' || 
            job.contractType === 'JOVEM_APRENDIZ' || 
            /sem experiência|primeiro emprego|não exige experiência|jovem aprendiz|estágio/i.test(`${job.title} ${job.requirements || ''} ${job.description}`)) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              <span>🌱 Sem Experiência</span>
            </span>
          )}
        </div>

        {/* Resumo da Descrição */}
        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Rodapé do Card */}
      <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400">
        <span className="truncate">{job.verifiedAt ? `Conferida em ${job.verifiedAt.split('-').reverse().join('/')}` : 'Confira a fonte'}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Ver detalhes</span>
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
      </div>
    </article>
  );
};

```
