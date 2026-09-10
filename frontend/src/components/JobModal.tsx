import React, { useEffect } from 'react';
import { X, MapPin, Building2, Send, Share2, AlertCircle } from 'lucide-react';
import { Job } from '../types/job';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({ job, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (job) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [job, onClose]);

  if (!job) return null;

  // Schema.org JobPosting para Google Jobs
  const jobPostingSchema = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.publishedAt || job.createdAt,
    "validThrough": "2027-01-01T00:00:00",
    "employmentType": job.contractType === 'CLT' ? 'FULL_TIME' : 'CONTRACTOR',
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companyName,
      "logo": job.companyLogoUrl || "https://natalvagas.com.br/assets/logo-natalvagas.jpg"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": job.neighborhood || "Natal",
        "addressLocality": job.city,
        "addressRegion": "RN",
        "addressCountry": "BR"
      }
    }
  };

  const handleApplyClick = () => {
    if (job.applicationChannel === 'EMAIL') {
      window.location.href = `mailto:${job.applicationTarget}?subject=Candidatura: ${encodeURIComponent(job.title)} (Via Natal Vagas)`;
    } else if (job.applicationChannel === 'WHATSAPP') {
      const text = `Olá! Vi a vaga de *${job.title}* no site Natal Vagas e gostaria de enviar meu currículo.`;
      window.open(`https://api.whatsapp.com/send?phone=${job.applicationTarget}&text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(job.applicationTarget, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      
      {/* Script com Schema JSON-LD para Google Jobs */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />

      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="p-6 bg-gradient-to-r from-brand-50 to-white border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-brand-600 font-bold text-xl uppercase overflow-hidden shrink-0">
              {job.companyLogoUrl ? (
                <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                {job.companyName}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {job.title}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.neighborhood ? `${job.neighborhood}, ` : ''}{job.city}/RN</span>
                <span>•</span>
                <span>{job.workModel}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          
          {/* Informações Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Regime</span>
              <p className="font-semibold text-slate-800">{job.contractType}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Salário</span>
              <p className="font-semibold text-emerald-600">
                {!job.hideSalary && job.salaryMin 
                  ? `R$ ${job.salaryMin.toLocaleString('pt-BR')}` 
                  : 'A combinar'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Local</span>
              <p className="font-semibold text-slate-800">{job.city}/RN</p>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Descrição da Vaga
            </h3>
            <div className="whitespace-pre-line text-slate-700">
              {job.description}
            </div>
          </div>

          {/* Requisitos */}
          {job.requirements && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Requisitos e Qualificações
              </h3>
              <div className="whitespace-pre-line text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Benefícios */}
          {job.benefits && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Benefícios
              </h3>
              <div className="whitespace-pre-line text-slate-700">
                {job.benefits}
              </div>
            </div>
          )}

          {/* Alerta Anti-Golpe */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Dica de Segurança:</strong> O Natal Vagas nunca cobra taxas de candidatos. Desconfie de ofertas que exijam pagamento para participar de processos seletivos ou comprar cursos preparatórios.
            </p>
          </div>

        </div>

        {/* Botão de Ação / Candidatura */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              const text = `Vaga: *${job.title}* em Natal/RN: https://natalvagas.com.br/vaga/${job.slug}`;
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar</span>
          </button>

          <button
            onClick={handleApplyClick}
            className="flex-1 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Candidatar-se Agora</span>
          </button>
        </div>

      </div>
    </div>
  );
};
