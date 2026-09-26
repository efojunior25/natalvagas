import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, MapPin, Clock, DollarSign, Share2, CheckCircle2, 
  ExternalLink, Mail, ArrowLeft, ShieldCheck, Sparkles, AlertTriangle, 
  Copy, Check, Send, Globe, Instagram, Linkedin,
  FileText, ChevronRight, Briefcase, Edit3
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { Job } from '../types/job';
import { SocialPostGeneratorModal } from '../components/SocialPostGeneratorModal';
import { AdminJobEditModal } from '../components/AdminJobEditModal';
import { useAuth } from '../context/AuthContext';

const PostJobModal = lazy(() => import('../components/PostJobModal').then(m => ({ default: m.PostJobModal })));

interface JobDetailsPageProps {
  jobs: Job[];
  isLoading: boolean;
  onJobCreated: () => void;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ jobs, isLoading, onJobCreated }) => {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [localJob, setLocalJob] = useState<Job | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  // 1. Busca da vaga no array da aplicação (ou em cache)
  const currentJob = useMemo(() => {
    if (!slug) return null;
    const foundInProps = jobs.find(j => j.slug === slug || String(j.id) === slug);
    if (foundInProps) return foundInProps;
    return localJob;
  }, [jobs, slug, localJob]);

  // Se o usuário entrou diretamente pela URL e os jobs da prop ainda estão vazios, faz fetch rápido do catálogo
  useEffect(() => {
    if (!currentJob && slug && !isLoading) {
      let isMounted = true;
      setIsFetchingDirect(true);
      fetch('/data/jobs.json')
        .then(res => res.ok ? res.json() : [])
        .then((allJobs: Job[]) => {
          if (!isMounted) return;
          const found = allJobs.find(j => j.slug === slug || String(j.id) === slug);
          if (found) {
            setLocalJob(found);
          }
        })
        .catch(err => {
          console.warn('Erro ao carregar vaga diretamente:', err);
        })
        .finally(() => {
          if (isMounted) setIsFetchingDirect(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [slug, currentJob, isLoading]);

  // Rola para o topo ao trocar de vaga
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCopiedLink(false);
    setCopiedEmail(false);
    setCopiedCoverLetter(false);
  }, [slug]);

  // 2. Metadados Dinâmicos de SEO & OpenGraph para Redes Sociais / WhatsApp
  useEffect(() => {
    if (!currentJob) return;

    const pageTitle = `${currentJob.title} — ${currentJob.companyName} (${currentJob.city}/RN) | Natal Vagas`;
    const description = `Vaga de ${currentJob.title} na empresa ${currentJob.companyName} em ${currentJob.city}/RN. Confira os requisitos, benefícios e envie seu currículo gratuitamente no Natal Vagas.`;
    const jobUrl = `https://natalvagas.com.br/vaga/${currentJob.slug}`;

    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', jobUrl);

    // OpenGraph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', jobUrl);
  }, [currentJob]);

  const [isAdminEditModalOpen, setIsAdminEditModalOpen] = useState(false);
  const isAdminLoggedIn = user?.role === 'EDITDEV';

  // Determina se a empresa tem o Selo de Empresa Verificada (estrito para quem o administrador homologou)
  const isVerifiedCompany = useMemo(() => {
    if (!currentJob) return false;
    return Boolean(currentJob.isCompanyVerified);
  }, [currentJob]);

  // Se a imagem for um flyer retangular/panfleto ou o logo genérico do portal, usa avatar corporativo
  const isCleanLogo = useMemo(() => {
    if (!currentJob?.companyLogoUrl) return false;
    return !currentJob.companyLogoUrl.includes('/assets/vagas/') && 
           !currentJob.companyLogoUrl.includes('WhatsApp Image') &&
           !currentJob.companyLogoUrl.includes('logo-natalvagas');
  }, [currentJob]);

  const defaultAvatarBg = (currentJob && /confidencial/i.test(currentJob.companyName)) ? '334155' : '059669';

  const handleToggleVerified = () => {
    if (!currentJob) return;
    const key = currentJob.slug || String(currentJob.id);
    const updatedStatus = !currentJob.isCompanyVerified;
    const updatedJob = { ...currentJob, isCompanyVerified: updatedStatus };
    setLocalJob(updatedJob);

    try {
      const stored = localStorage.getItem('natalvagas_job_overrides');
      const overrides = stored ? JSON.parse(stored) : {};
      overrides[key] = { ...(overrides[key] || {}), isCompanyVerified: updatedStatus };
      localStorage.setItem('natalvagas_job_overrides', JSON.stringify(overrides));
    } catch {}
  };

  const handleToggleFeatured = () => {
    if (!currentJob) return;
    const key = currentJob.slug || String(currentJob.id);
    const updatedStatus = !currentJob.isFeatured;
    const updatedJob = { ...currentJob, isFeatured: updatedStatus };
    setLocalJob(updatedJob);

    try {
      const stored = localStorage.getItem('natalvagas_job_overrides');
      const overrides = stored ? JSON.parse(stored) : {};
      overrides[key] = { ...(overrides[key] || {}), isFeatured: updatedStatus };
      localStorage.setItem('natalvagas_job_overrides', JSON.stringify(overrides));
    } catch {}
  };

  const handleAdminSave = (savedJob: Job) => {
    setLocalJob(savedJob);
    const key = savedJob.slug || String(savedJob.id);
    try {
      const stored = localStorage.getItem('natalvagas_job_overrides');
      const overrides = stored ? JSON.parse(stored) : {};
      overrides[key] = savedJob;
      localStorage.setItem('natalvagas_job_overrides', JSON.stringify(overrides));
    } catch {}
    setIsAdminEditModalOpen(false);
  };

  // Vagas Relacionadas (mesma cidade ou setor, excluindo a atual)
  const relatedJobs = useMemo(() => {
    if (!currentJob || jobs.length === 0) return [];
    return jobs
      .filter(j => j.id !== currentJob.id && (j.city === currentJob.city || (Boolean(currentJob.category?.id) && j.category?.id === currentJob.category?.id)))
      .slice(0, 4);
  }, [currentJob, jobs]);

  // Outras vagas da mesma empresa
  const otherJobsFromCompany = useMemo(() => {
    if (!currentJob || jobs.length === 0 || /confidencial/i.test(currentJob.companyName)) return [];
    return jobs
      .filter(j => j.id !== currentJob.id && j.companyName.toLowerCase() === currentJob.companyName.toLowerCase())
      .slice(0, 3);
  }, [currentJob, jobs]);

  // Funções de Compartilhamento
  const handleShare = async () => {
    if (!currentJob) return;
    const shareTitle = `${currentJob.title} — ${currentJob.companyName} (${currentJob.city}/RN)`;
    const shareText = `🔥 Oportunidade: Vaga de *${currentJob.title}* na empresa *${currentJob.companyName}* em ${currentJob.city}/RN!\n\nVeja todos os detalhes e envie seu currículo no Natal Vagas:`;
    const shareUrl = `https://natalvagas.com.br/vaga/${currentJob.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n${shareUrl}`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleCopyCoverLetter = (job: Job) => {
    const letter = `Prezado(a) Recrutador(a) da empresa ${job.companyName},\n\nVenho por meio deste candidatar-me à vaga de ${job.title}, divulgada no portal Natal Vagas.\n\nPossuo total interesse na oportunidade e disponibilidade para atuar em ${job.city}/RN. Em anexo, envio meu currículo atualizado para análise.\n\nFico à disposição para uma entrevista.\n\nAtenciosamente,\n[Seu Nome Completo]\n[Seu Telefone / WhatsApp]`;
    navigator.clipboard.writeText(letter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 3500);
  };

  // Links de e-mail formatados
  const emailSubject = currentJob ? `Candidatura: ${currentJob.title} (Via Natal Vagas)` : '';
  const emailBody = currentJob 
    ? `Olá! Tenho interesse na vaga de ${currentJob.title}, divulgada no Natal Vagas.\n\nSegue meu currículo anexo para avaliação.\n\nNome:\nTelefone:` 
    : '';
  const gmailUrl = currentJob ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(currentJob.applicationTarget)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : '';
  const outlookUrl = currentJob ? `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(currentJob.applicationTarget)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : '';

  // Schema.org JobPosting para Google Jobs
  const jobPostingSchema = currentJob ? {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": currentJob.title,
    "description": currentJob.description,
    "datePosted": currentJob.publishedAt || currentJob.createdAt,
    "validThrough": currentJob.expiresAt || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": currentJob.contractType === 'ESTAGIO' 
      ? 'INTERN' 
      : currentJob.contractType === 'TEMPORARIO' 
      ? 'TEMPORARY' 
      : currentJob.contractType === 'PJ' 
      ? 'CONTRACTOR' 
      : 'FULL_TIME',
    "hiringOrganization": {
      "@type": "Organization",
      "name": currentJob.companyName,
      "logo": currentJob.companyLogoUrl || "https://natalvagas.com.br/assets/logo-natalvagas.jpg",
      ...(currentJob.companyWebsite ? { "sameAs": currentJob.companyWebsite } : {})
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": currentJob.neighborhood || "Natal",
        "addressLocality": currentJob.city,
        "addressRegion": "RN",
        "addressCountry": "BR"
      }
    },
    "directApply": true,
    ...(currentJob.salaryMin ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "BRL",
        "value": {
          "@type": "QuantitativeValue",
          "value": currentJob.salaryMin,
          ...(currentJob.salaryMax ? { "maxValue": currentJob.salaryMax } : {}),
          "unitText": "MONTH"
        }
      }
    } : {})
  } : null;

  // Tela de Carregamento
  if (isLoading || isFetchingDirect) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
        <Navbar onOpenPostJob={() => setIsPostJobOpen(true)} />
        <main className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando detalhes da vaga no Natal Vagas...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Tela de Vaga Não Encontrada ou Expirada
  if (!currentJob) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
        <Navbar onOpenPostJob={() => setIsPostJobOpen(true)} />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Vaga Não Encontrada ou Expirada
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
            Esta vaga pode ter sido preenchida pela empresa recentemente ou o link acessado está incorreto. Não se preocupe, temos centenas de outras vagas abertas no RN!
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Briefcase className="w-4 h-4" />
              Ver Todas as Vagas Abertas
            </Link>
            <Link
              to="/criar-curriculo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <FileText className="w-4 h-4 text-brand-600" />
              Criar Currículo Grátis
            </Link>
          </div>
          <div className="mt-12">
            <AdPlaceholder format="horizontal" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Script com Schema JSON-LD para Google Jobs */}
      {jobPostingSchema && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}

      {/* Cabeçalho da Aplicação */}
      <Navbar onOpenPostJob={() => setIsPostJobOpen(true)} />

      {/* Conteúdo Principal da Vaga */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        
        {/* Navegação Breadcrumb & Voltar */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 font-medium transition-colors shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <Link to={`/?cidade=${encodeURIComponent(currentJob.city)}`} className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors shrink-0">
              Vagas em {currentJob.city}/RN
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {currentJob.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Copiar link oficial da vaga"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compartilhar</span>
            </button>
          </div>
        </nav>

        {/* Painel de Ações Rápidas do Administrador (/editdev) */}
        {isAdminLoggedIn && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 dark:bg-amber-950/30 dark:border-amber-600/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Modo Administrador Ativo (@natalvagas.com.br)
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Gerenciando vaga #{currentJob.id}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdminEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Vaga</span>
              </button>

              <button
                type="button"
                onClick={handleToggleVerified}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  isVerifiedCompany
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isVerifiedCompany ? 'Remover Selo Verificado' : 'Ativar Selo Verificado'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFeatured}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  currentJob.isFeatured
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentJob.isFeatured ? 'Remover Destaque VIP' : 'Ativar Destaque VIP'}</span>
              </button>

              <Link
                to="/editdev"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs font-bold hover:bg-black transition-colors"
              >
                <span>Painel /editdev</span>
              </Link>
            </div>
          </div>
        )}

        {/* 1. ESPAÇO PUBLICITÁRIO ADSENSE SUPERIOR (Leaderboard) */}
        <div className="mb-6">
          <AdPlaceholder format="horizontal" />
        </div>

        {/* Grid Principal: 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA PRINCIPAL DA VAGA (8 Colunas) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card Principal: Cabeçalho & Visão Geral */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              
              {/* Faixa decorativa no topo */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                currentJob.isFeatured 
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300' 
                  : 'bg-gradient-to-r from-brand-500 to-indigo-600'
              }`} />

              {/* Badges de Selos (Destaque VIP, Empresa Verificada, PcD, Sem Experiência) */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {isVerifiedCompany && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/60 px-3 py-1 rounded-full shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/30" />
                    <span>EMPRESA VERIFICADA</span>
                  </div>
                )}

                {currentJob.isFeatured && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 px-3 py-1 rounded-full shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                    <span>VAGA EM DESTAQUE VIP</span>
                  </div>
                )}

                {(currentJob.isPcd || /pcd|pessoa com deficiência|deficiência/i.test(`${currentJob.title} ${currentJob.description} ${currentJob.requirements || ''}`)) && (
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1 rounded-full shadow-2xs">
                    <span>♿ Vaga Inclusiva PcD</span>
                  </div>
                )}

                {(currentJob.contractType === 'ESTAGIO' || 
                  currentJob.contractType === 'JOVEM_APRENDIZ' || 
                  /sem experiência|primeiro emprego|não exige experiência/i.test(`${currentJob.title} ${currentJob.requirements || ''} ${currentJob.description}`)) && (
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full shadow-2xs">
                    <span>🌱 Sem Experiência / 1º Emprego</span>
                  </div>
                )}
              </div>

              {/* Título Principal (H1) */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {currentJob.title}
              </h1>

              {/* Linha da Empresa com Logotipo e Nome */}
              <div className="mt-4 flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xl sm:text-2xl overflow-hidden shrink-0 shadow-xs p-1">
                  <img 
                    src={(isCleanLogo && currentJob.companyLogoUrl) ? currentJob.companyLogoUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentJob.companyName)}&background=${defaultAvatarBg}&color=fff&size=128&bold=true`} 
                    alt={`Logo ${currentJob.companyName}`} 
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentJob.companyName)}&background=${defaultAvatarBg}&color=fff&size=128&bold=true`;
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                      {currentJob.companyName}
                    </span>
                    {isVerifiedCompany && (
                      <span title="Empresa Verificada pelo Natal Vagas" className="text-blue-500 inline-flex items-center">
                        <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentJob.neighborhood ? `${currentJob.neighborhood}, ${currentJob.city}/RN` : `${currentJob.city}/RN`}</span>
                  </p>
                </div>
              </div>

              {/* Grade de Pílulas com Detalhes Chave */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                
                {/* Modalidade */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Modalidade</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {currentJob.workModel === 'NAO_INFORMADO' ? 'A Definir' : currentJob.workModel}
                    </span>
                  </div>
                </div>

                {/* Regime de Contratação */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Contrato</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {currentJob.contractType === 'NAO_INFORMADO' ? 'CLT / Efetivo' : currentJob.contractType}
                    </span>
                  </div>
                </div>

                {/* Remuneração */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Salário</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 truncate block">
                      {!currentJob.hideSalary && currentJob.salaryMin 
                        ? `R$ ${currentJob.salaryMin.toLocaleString('pt-BR')}${currentJob.salaryMax ? ` a R$ ${currentJob.salaryMax.toLocaleString('pt-BR')}` : ''}`
                        : 'A Combinar'
                      }
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* 2. BANNER OFICIAL NATAL VAGAS (COMUNIDADE & ALERTA DE VAGAS) */}
            <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-emerald-600 via-teal-600 to-brand-700 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
                <Send className="w-64 h-64 text-white" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>CANAL OFICIAL NATAL VAGAS</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black leading-tight">
                    Receba vagas fresquinhas no seu WhatsApp!
                  </h3>
                  <p className="text-emerald-50 text-xs sm:text-sm max-w-xl">
                    Entre na nossa comunidade oficial gratuita com mais de 35.000 profissionais no RN e seja avisado assim que novas oportunidades surgirem.
                  </p>
                </div>

                <a
                  href="https://chat.whatsapp.com/natalvagas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 shrink-0 active:scale-95"
                >
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Entrar no Grupo VIP Grátis</span>
                </a>
              </div>
            </div>

            {/* Seção: Descrição da Vaga */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
                <FileText className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  Descrição da Vaga
                </h2>
              </div>
              
              <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words space-y-3">
                {currentJob.description}
              </div>
            </div>

            {/* Seção: Canais Oficiais & Redes da Empresa */}
            {(currentJob.companyWebsite || currentJob.companyInstagram) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-brand-600 dark:text-brand-400">
                    <Globe className="w-5 h-5" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      Canais Oficiais da Contratante
                    </h2>
                  </div>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Fonte Verificada
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Conheça a empresa, confira a cultura corporativa e acompanhe novas oportunidades pelos canais oficiais:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {currentJob.companyInstagram && (
                    <a
                      href={currentJob.companyInstagram.startsWith('http') ? currentJob.companyInstagram : `https://instagram.com/${currentJob.companyInstagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/5 hover:from-pink-500/20 hover:to-purple-500/15 border border-pink-200 dark:border-pink-900/50 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-200 transition-all group shadow-2xs active:scale-98"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Instagram className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400">Instagram Oficial</span>
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate block">
                            {currentJob.companyInstagram.startsWith('@') ? currentJob.companyInstagram : `@${currentJob.companyInstagram.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '')}`}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </a>
                  )}

                  {currentJob.companyWebsite && (
                    <a
                      href={currentJob.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-200 transition-all group shadow-2xs active:scale-98"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 shadow-xs">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Site Oficial</span>
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate block">
                            {currentJob.companyWebsite.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 3. ESPAÇO PUBLICITÁRIO IN-CONTENT (MEIO DO CONTEÚDO) */}
            <AdPlaceholder format="horizontal" />

            {/* Seção: Requisitos e Qualificações (se houver) */}
            {currentJob.requirements && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    Requisitos e Qualificações
                  </h2>
                </div>
                
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                  {currentJob.requirements.split('\n').map((req, idx) => {
                    const clean = req.trim();
                    if (!clean) return null;
                    return (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                        <span>{clean.replace(/^[•\-\*]\s*/, '')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção: Benefícios Oferecidos (se houver) */}
            {currentJob.benefits && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 text-amber-500 dark:text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    Benefícios Oferecidos
                  </h2>
                </div>
                
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                  {currentJob.benefits.split('\n').map((ben, idx) => {
                    const clean = ben.trim();
                    if (!clean) return null;
                    return (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="text-amber-500 font-bold shrink-0 mt-0.5">✦</span>
                        <span>{clean.replace(/^[•\-\*]\s*/, '')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. ESPAÇO PUBLICITÁRIO PRÉ-CANDIDATURA (ALTA VISIBILIDADE) */}
            <AdPlaceholder format="horizontal" />

            {/* BOX DE CANDIDATURA OFICIAL */}
            <div id="candidatura" className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-6 sm:p-8 border-2 border-brand-500/40 dark:border-brand-500/30 shadow-lg space-y-6">
              
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block mb-1">
                    Processo Seletivo Oficial
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Como se candidatar a esta vaga
                  </h3>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3.5 h-3.5" />
                  <span>100% Gratuito</span>
                </div>
              </div>

              {/* CTA Estratégico de Conversão: Gerador de Currículo ATS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                        Dica de RH • Aumente em até 3x suas chances
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Seu currículo está aprovado nos robôs de triagem (ATS)?
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                      Antes de enviar para a empresa, garanta um currículo formatado no padrão executivo aceito pelos recrutadores no RN. PDF pronto em 2 minutos por apenas R$ 9,90 no Pix.
                    </p>
                  </div>
                </div>
                <Link
                  to="/criar-curriculo"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all shrink-0 active:scale-95 flex items-center gap-2 self-stretch sm:self-auto justify-center"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Otimizar Meu Currículo</span>
                </Link>
              </div>

              {/* CASO 1: CANDIDATURA POR E-MAIL */}
              {currentJob.applicationChannel === 'EMAIL' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    A empresa solicita o envio do seu currículo por e-mail com o assunto informado abaixo:
                  </p>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold text-slate-400 uppercase">E-mail para envio</span>
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate block">
                          {currentJob.applicationTarget}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyEmail(currentJob.applicationTarget)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200 dark:border-brand-800/60 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedEmail ? 'E-mail Copiado!' : 'Copiar E-mail'}</span>
                    </button>
                  </div>

                  {/* Botões diretos para envio de e-mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <a
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Abrir no Gmail</span>
                    </a>

                    <a
                      href={outlookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Abrir no Outlook / Hotmail</span>
                    </a>
                  </div>

                  {/* Modelo Pronto de Mensagem */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCoverLetter(currentJob)}
                      className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {copiedCoverLetter ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-brand-600" />}
                      <span>{copiedCoverLetter ? 'Modelo de Apresentação Copiado!' : 'Copiar Modelo de Mensagem Pronto para Colar no E-mail'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CASO 2: CANDIDATURA POR WHATSAPP */}
              {currentJob.applicationChannel === 'WHATSAPP' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    A empresa recebe currículos diretamente pelo WhatsApp. Clique no botão abaixo para iniciar a conversa já com a mensagem pronta:
                  </p>

                  <a
                    href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(currentJob.applicationTarget)}&text=${encodeURIComponent(`Olá! Vi a vaga de *${currentJob.title}* no site Natal Vagas e gostaria de enviar meu currículo para avaliação.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                    <span>Conversar e Enviar Currículo no WhatsApp</span>
                  </a>
                </div>
              )}

              {/* CASO 3: CANDIDATURA POR LINK / SITE OFICIAL */}
              {currentJob.applicationChannel === 'LINK' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Esta oportunidade é gerenciada pelo portal oficial de carreiras da empresa ou parceiro oficial. Clique abaixo para acessar a página oficial de inscrição:
                  </p>

                  <a
                    href={currentJob.applicationTarget}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <span>Acessar Página Oficial de Candidatura</span>
                    <ExternalLink className="w-5 h-5" />
                  </a>

                  <p className="text-[11px] text-slate-400 text-center">
                    Você será redirecionado em segurança para o site oficial da vaga.
                  </p>
                </div>
              )}

              {/* Dica de Segurança & Alerta Anti-Golpe */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block mb-0.5">Dica de Segurança do Natal Vagas:</span>
                  <p className="leading-relaxed">
                    Nunca pague por processos seletivos, testes de aptidão, exames médicos admissionais ou cursos obrigatórios para conseguir uma vaga. O Natal Vagas preza por vagas 100% autênticas e gratuitas.
                  </p>
                  <Link to="/dicas-seguranca" className="inline-flex items-center gap-1 font-bold text-amber-900 dark:text-amber-100 underline mt-1.5 hover:text-brand-600">
                    <span>Ler todas as nossas dicas de segurança</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Seção: Gerador de Currículo */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                  Aumente suas chances de contratação
                </span>
                <h3 className="text-lg sm:text-xl font-bold">
                  Precisa de um currículo profissional em PDF?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                  Crie seu currículo formatado no padrão aceito pelas empresas de Natal e RN em menos de 5 minutos, direto pelo celular.
                </p>
              </div>

              <Link
                to="/criar-curriculo"
                className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-all shrink-0 active:scale-95 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Criar Currículo Grátis</span>
              </Link>
            </div>

          </div>

          {/* COLUNA LATERAL (SIDEBAR DIREITA - 4 Colunas) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* PAINEL DA EMPRESA CONTRATANTE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sobre a Contratante
                </span>
                {isVerifiedCompany && (
                  <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    Verificada
                  </span>
                )}
              </div>

              {/* Perfil da Empresa */}
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xl overflow-hidden shrink-0 shadow-xs p-1">
                  <img 
                    src={(isCleanLogo && currentJob.companyLogoUrl) ? currentJob.companyLogoUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentJob.companyName)}&background=${defaultAvatarBg}&color=fff&size=128&bold=true`} 
                    alt={`Logo ${currentJob.companyName}`} 
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentJob.companyName)}&background=${defaultAvatarBg}&color=fff&size=128&bold=true`;
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentJob.companyName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{currentJob.city}/RN</span>
                  </p>
                </div>
              </div>

              {/* Selo de Garantia da Empresa Verificada */}
              {isVerifiedCompany ? (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-blue-700 dark:text-blue-300">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Empresa Homologada</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Esta empresa teve seus dados e canal oficial de seleção auditados pela equipe do Natal Vagas.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Vaga da Comunidade
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Oportunidade coletada e verificada nos canais públicos de emprego do Rio Grande do Norte.
                  </p>
                </div>
              )}

              {/* Informações da Empresa: Site & Redes Sociais */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Canais Oficiais da Empresa
                </span>

                <div className="flex flex-col gap-2">
                  {/* Site Oficial */}
                  {currentJob.companyWebsite ? (
                    <a
                      href={currentJob.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Globe className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="truncate">Site Oficial</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      <span className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-300" />
                        <span>Site não informado</span>
                      </span>
                    </div>
                  )}

                  {/* Instagram */}
                  {currentJob.companyInstagram ? (
                    <a
                      href={currentJob.companyInstagram.startsWith('http') ? currentJob.companyInstagram : `https://instagram.com/${currentJob.companyInstagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                        <span className="truncate">Instagram Oficial</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  ) : null}

                  {/* LinkedIn */}
                  {currentJob.companyLinkedin ? (
                    <a
                      href={currentJob.companyLinkedin}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Linkedin className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">LinkedIn da Empresa</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Apresentação sobre a Empresa (se houver) */}
              {currentJob.companyDescription && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Histórico & Atuação:
                  </span>
                  <p className="leading-relaxed">
                    {currentJob.companyDescription}
                  </p>
                </div>
              )}

              {/* Outras Vagas da Mesma Empresa */}
              {otherJobsFromCompany.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Mais Vagas nesta Empresa ({otherJobsFromCompany.length})
                  </span>
                  <div className="space-y-2">
                    {otherJobsFromCompany.map(oj => (
                      <Link
                        key={oj.id}
                        to={`/vaga/${oj.slug}`}
                        className="block p-2.5 rounded-xl bg-slate-50 hover:bg-brand-50 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-xs transition-colors group"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 block truncate">
                          {oj.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {oj.city}/RN • {oj.contractType}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* 5. ESPAÇO PUBLICITÁRIO SIDEBAR STICKY (RETÂNGULO MÉDIO 300x250) */}
            <div className="sticky top-24 space-y-6">
              <AdPlaceholder format="rectangle" />

              {/* Card para Empresas: Anuncie sua Vaga */}
              <div className="bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 rounded-3xl p-6 border border-brand-200/80 dark:border-slate-700 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  É Recrutador no RN?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Anuncie sua vaga no maior portal de empregos do Rio Grande do Norte e alcance candidatos qualificados.
                </p>
                <button
                  onClick={() => setIsPostJobOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Publicar Vaga Grátis ou VIP
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* 6. ESPAÇO PUBLICITÁRIO ANTES DAS VAGAS RELACIONADAS */}
        <div className="mt-12 mb-6">
          <AdPlaceholder format="horizontal" />
        </div>

        {/* SEÇÃO DE VAGAS RELACIONADAS (RECOMENDADAS) */}
        {relatedJobs.length > 0 && (
          <section className="mt-8 mb-12">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block mb-1">
                  Continue Navegando
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  Outras Vagas em Destaque no RN
                </h3>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors shrink-0"
              >
                <span>Ver todas</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedJobs.map((rj) => (
                <Link
                  key={rj.id}
                  to={`/vaga/${rj.slug}`}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 block truncate">
                      {rj.companyName}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-sm leading-snug line-clamp-2 transition-colors">
                      {rj.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{rj.city}/RN</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-brand-600 dark:text-brand-400 font-bold">
                    <span>Ver oportunidade</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Modal de Publicação de Vaga por Empresas (Lazy Loaded) */}
      <Suspense fallback={null}>
        {isPostJobOpen && (
          <PostJobModal 
            isOpen={isPostJobOpen} 
            onClose={() => setIsPostJobOpen(false)}
            onJobCreated={onJobCreated}
          />
        )}
      </Suspense>

      {/* Modal Gerador de Post para Instagram / Redes Sociais */}
      {isSocialModalOpen && currentJob && (
        <SocialPostGeneratorModal
          job={currentJob}
          isOpen={isSocialModalOpen}
          onClose={() => setIsSocialModalOpen(false)}
        />
      )}

      {/* Modal de Edição de Vaga pelo Administrador */}
      {isAdminEditModalOpen && currentJob && (
        <AdminJobEditModal
          job={currentJob}
          isOpen={isAdminEditModalOpen}
          onClose={() => setIsAdminEditModalOpen(false)}
          onSave={handleAdminSave}
        />
      )}

      {/* Rodapé Oficial da Aplicação */}
      <Footer />

    </div>
  );
};
