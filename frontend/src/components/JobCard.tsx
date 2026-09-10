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
      className={`group relative rounded-2xl p-5 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between border ${
        job.isFeatured
          ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 via-white to-white hover:border-amber-400'
          : 'bg-white border-slate-200/90 hover:border-brand-300 hover:shadow-slate-200/50'
      }`}
    >
      <div>
        {/* Selo Vaga em Destaque (Se contratado) */}
        {job.isFeatured && (
          <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
            <span>VAGA EM DESTAQUE VIP</span>
          </div>
        )}

        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg uppercase shrink-0 overflow-hidden group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
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
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                {job.companyName}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Botão Compartilhar WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            title={`Compartilhar vaga de ${job.title} no WhatsApp`}
            aria-label={`Compartilhar vaga de ${job.title} no WhatsApp`}
            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Localização e Badges */}
        <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {job.neighborhood ? `${job.neighborhood}, ${job.city}` : `${job.city}/RN`}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 font-medium border border-brand-100">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            {job.contractType === 'NAO_INFORMADO' ? 'Regime não informado' : job.contractType} • {job.workModel === 'NAO_INFORMADO' ? 'Modalidade não informada' : job.workModel}
          </span>

          {!job.hideSalary && job.salaryMin && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              R$ {job.salaryMin.toLocaleString('pt-BR')}
              {job.salaryMax ? ` - R$ ${job.salaryMax.toLocaleString('pt-BR')}` : ''}
            </span>
          )}
        </div>

        {/* Resumo da Descrição */}
        <p className="mt-3 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Rodapé do Card */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>{job.verifiedAt ? `Conferida em ${job.verifiedAt.split('-').reverse().join('/')}` : 'Confira a fonte'}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
          Ver detalhes e candidatar-se
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </article>
  );
};
