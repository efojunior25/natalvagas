# File: JobModal.tsx
- **Original Path:** `frontend/src/components/JobModal.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 292

---

```tsx
import React, { useEffect, useState } from 'react';
import { X, MapPin, Building2, Send, Share2, AlertCircle, Instagram } from 'lucide-react';
import { Job } from '../types/job';
import { SocialPostGeneratorModal } from './SocialPostGeneratorModal';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({ job, onClose }) => {
  const [showEmailOptions, setShowEmailOptions] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  useEffect(() => {
    setShowEmailOptions(false);
    setCopyStatus('');
  }, [job?.id]);
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

  const emailSubject = `Candidatura: ${job.title} (Via Natal Vagas)`;
  const emailBody = `Olá! Tenho interesse na vaga de ${job.title}, divulgada no Natal Vagas.\n\nSegue meu currículo para avaliação.\n\nNome:\nTelefone:`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(job.applicationTarget)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(job.applicationTarget)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Schema.org JobPosting para Google Jobs
  const jobPostingSchema = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.publishedAt || job.createdAt,
    "validThrough": job.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": job.contractType === 'ESTAGIO' 
      ? 'INTERN' 
      : job.contractType === 'TEMPORARIO' 
      ? 'TEMPORARY' 
      : job.contractType === 'PJ' 
      ? 'CONTRACTOR' 
      : 'FULL_TIME',
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
    },
    "directApply": true,
    ...(job.salaryMin ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "BRL",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.salaryMin,
          ...(job.salaryMax ? { "maxValue": job.salaryMax } : {}),
          "unitText": "MONTH"
        }
      }
    } : {})
  };

  const handleApplyClick = () => {
    if (job.applicationChannel === 'EMAIL') {
      setShowEmailOptions(true);
    } else if (job.applicationChannel === 'WHATSAPP') {
      const text = `Olá! Vi a vaga de *${job.title}* no site Natal Vagas e gostaria de enviar meu currículo.`;
      window.open(`https://api.whatsapp.com/send?phone=${job.applicationTarget}&text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(job.applicationTarget, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      
      {/* Script com Schema JSON-LD para Google Jobs */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />

      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-brand-50 to-white border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-brand-600 font-bold text-lg sm:text-xl uppercase overflow-hidden shrink-0 mt-0.5 sm:mt-0">
              {job.companyLogoUrl ? (
                <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-semibold text-brand-600 uppercase tracking-wider block truncate">
                {job.companyName}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug break-words">
                {job.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {job.neighborhood ? `${job.neighborhood}, ` : ''}{job.city}/RN
                </span>
                <span>•</span>
                <span>{job.workModel === 'NAO_INFORMADO' ? 'Modalidade não informada' : job.workModel}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Fechar detalhes da vaga"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-slate-700 text-sm leading-relaxed">
          
          {/* Informações Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Regime</span>
              <p className="font-semibold text-slate-800">{job.contractType === 'NAO_INFORMADO' ? 'Não informado' : job.contractType}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Salário</span>
              <p className="font-semibold text-emerald-600">
                {!job.hideSalary && job.salaryMin 
                  ? `R$ ${job.salaryMin.toLocaleString('pt-BR')}` 
                  : 'Não informado'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Local</span>
              <p className="font-semibold text-slate-800">{job.city}/RN</p>
            </div>
          </div>

          {job.sourceUrl && (
            <div className="p-4 bg-brand-50 rounded-xl text-sm space-y-1">
              <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">Fonte: {job.sourceName}</a>
              <p>Conferida em {job.verifiedAt?.split('-').reverse().join('/')}. A disponibilidade pode mudar na fonte.</p>
              <p>{job.expiresAt ? `Inscrições até ${job.expiresAt.slice(0, 10).split('-').reverse().join('/')}` : 'Prazo de inscrição não informado pela empresa.'}</p>
            </div>
          )}

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
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
          {showEmailOptions && job.applicationChannel === 'EMAIL' ? (
            <section aria-label="Candidatura por e-mail" className="space-y-3">
              <h3 className="font-bold text-slate-900">Envie seu currículo por e-mail</h3>
              <p className="text-sm text-slate-600">Escolha onde escrever. Revise a mensagem e anexe seu currículo antes de enviar.</p>
              <p className="text-sm text-slate-700 break-all">Destinatário: <strong>{job.applicationTarget}</strong></p>
              <div className="flex flex-wrap gap-2">
                <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm">Abrir Gmail no navegador</a>
                <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl border border-slate-300 bg-white font-semibold text-sm">Abrir Outlook no navegador</a>
                <button type="button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(job.applicationTarget);
                    setCopyStatus('Endereço copiado. Cole no serviço de e-mail que você utiliza.');
                  } catch {
                    setCopyStatus('Não foi possível copiar. Selecione e copie o endereço exibido acima.');
                  }
                }} className="px-4 py-3 rounded-xl border border-slate-300 bg-white font-semibold text-sm">Copiar endereço de e-mail</button>
              </div>
              <p role="status" className="text-sm text-slate-600">{copyStatus || 'Você poderá precisar entrar na sua conta. Nenhum e-mail é enviado automaticamente.'}</p>
              <button type="button" onClick={() => setShowEmailOptions(false)} className="text-sm text-brand-700 underline">Voltar aos detalhes</button>
            </section>
          ) : <>
          <p className="text-xs text-slate-500 mb-3">{job.applicationChannel === 'EMAIL' ? 'Escolha seu serviço de e-mail para preparar a candidatura.' : job.applicationChannel === 'WHATSAPP' ? 'Converse com o responsável pela vaga no WhatsApp.' : 'A candidatura será feita na página da empresa, aberta em uma nova aba.'}</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const text = `Vaga: *${job.title}* em Natal/RN: https://natalvagas.com.br/vaga/${job.slug}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSocialModalOpen(true)}
                className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Gerar Arte para Instagram Feed ou Story"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>Gerar Card</span>
              </button>
            </div>

            <button
              onClick={handleApplyClick}
              className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="truncate">{job.applicationChannel === 'EMAIL' ? 'Enviar currículo por e-mail' : job.applicationChannel === 'WHATSAPP' ? 'Candidatar-se no WhatsApp' : 'Candidatar-se na empresa'}</span>
            </button>
          </div>
          </>}
        </div>

      </div>

      {/* Modal Gerador de Artes para Redes Sociais */}
      <SocialPostGeneratorModal
        job={job}
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
      />
    </div>
  );
};

```
