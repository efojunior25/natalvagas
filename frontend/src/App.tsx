import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { SeoCategoryHero } from './components/SeoCategoryHero';
import { JobCard } from './components/JobCard';
import { CityPills } from './components/CityPills';
import { FaqSection } from './components/FaqSection';
import { AdPlaceholder } from './components/AdPlaceholder';
import { Footer } from './components/Footer';
import { Job } from './types/job';
import { Sparkles, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { WhatsAppCommunityBanner } from './components/WhatsAppCommunityBanner';
import { CourseRecommendations } from './components/CourseRecommendations';
import { SEO_LANDING_PAGES, SEO_LANDING_MAP } from './data/seoLandingPages';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

// Lazy loading para páginas institucionais e modais (reduz bundle inicial)
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(m => ({ default: m.AboutUs })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const JobSafety = lazy(() => import('./pages/JobSafety').then(m => ({ default: m.JobSafety })));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder').then(m => ({ default: m.ResumeBuilder })));
const BlogList = lazy(() => import('./pages/BlogList').then(m => ({ default: m.BlogList })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(m => ({ default: m.BlogPost })));
const JobDetailsPage = lazy(() => import('./pages/JobDetailsPage').then(m => ({ default: m.JobDetailsPage })));
const PostJobModal = lazy(() => import('./components/PostJobModal').then(m => ({ default: m.PostJobModal })));
const EditDevPage = lazy(() => import('./pages/EditDevPage').then(m => ({ default: m.EditDevPage })));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons').then(m => ({ default: m.AdminCoupons })));

const PAGE_SIZE = 24;

interface HomePageProps {
  jobs: Job[];
  isLoading: boolean;
  onJobCreated: () => void;
  seoCategorySlug?: string;
}

const HomePage: React.FC<HomePageProps> = ({ jobs, isLoading, onJobCreated, seoCategorySlug }) => {
  const navigate = useNavigate();
  const [isPostJobOpen, setIsPostJobOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkModel, setSelectedWorkModel] = useState<string>('TODOS');
  const [onlyNoExperience, setOnlyNoExperience] = useState<boolean>(false);
  const [onlyPcd, setOnlyPcd] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Identifica se estamos em uma landing page programática de SEO
  const seoConfig = useMemo(() => {
    return seoCategorySlug ? SEO_LANDING_MAP.get(seoCategorySlug) : undefined;
  }, [seoCategorySlug]);

  // Sincroniza os filtros com a página de SEO acessada
  useEffect(() => {
    if (seoConfig) {
      if (seoConfig.city) setSelectedCity(seoConfig.city);
      else setSelectedCity('');

      if (seoConfig.onlyNoExperience) setOnlyNoExperience(true);
      else setOnlyNoExperience(false);

      if (seoConfig.onlyPcd) setOnlyPcd(true);
      else setOnlyPcd(false);

      if (seoConfig.workModel) setSelectedWorkModel(seoConfig.workModel);
      else setSelectedWorkModel('TODOS');

      setVisibleCount(PAGE_SIZE);
    } else {
      setSelectedCity('');
      setOnlyNoExperience(false);
      setOnlyPcd(false);
      setSelectedWorkModel('TODOS');
      setVisibleCount(PAGE_SIZE);
    }
  }, [seoConfig]);

  // Metadados dinâmicos de SEO da página principal
  useEffect(() => {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');

    if (seoConfig) {
      document.title = seoConfig.metaTitle;
      if (metaDesc) metaDesc.setAttribute('content', seoConfig.metaDescription);
      if (ogTitle) ogTitle.setAttribute('content', seoConfig.metaTitle);
      if (ogDesc) ogDesc.setAttribute('content', seoConfig.metaDescription);
      if (ogUrl) ogUrl.setAttribute('content', `https://natalvagas.com.br${seoConfig.path}`);
      canonical.setAttribute('href', `https://natalvagas.com.br${seoConfig.path}`);
    } else {
      const defaultTitle = 'Natal Vagas — Vagas de Emprego em Natal e no RN | Mais de 1.400 Oportunidades';
      const defaultDesc = 'Encontre mais de 1.400 vagas de emprego reais e verificadas em Natal, Mossoró, Parnamirim e todo o RN. Conectamos candidatos a empresas de forma 100% gratuita.';
      
      document.title = defaultTitle;
      if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
      if (ogTitle) ogTitle.setAttribute('content', defaultTitle);
      if (ogDesc) ogDesc.setAttribute('content', defaultDesc);
      if (ogUrl) ogUrl.setAttribute('content', 'https://natalvagas.com.br/');
      canonical.setAttribute('href', 'https://natalvagas.com.br/');
    }
  }, [seoConfig]);

  const handleSearch = (query: string, city: string) => {
    setSearchQuery(query);
    setSelectedCity(city);
    setVisibleCount(PAGE_SIZE);
  };

  const handleApply = (job: Job) => {
    navigate(`/vaga/${job.slug}`);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status !== 'APPROVED' || (job.expiresAt && Date.parse(job.expiresAt) < Date.now())) return false;
      
      // Filtro estrito de categoria por tipo de contrato (ex: estágio ou jovem aprendiz)
      if (seoConfig?.contractType && job.contractType !== seoConfig.contractType) {
        return false;
      }

      const matchesQuery = 
        !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.neighborhood && job.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()));

      // Permite sinônimos regionais como Assú e Açu
      const matchesCity = !selectedCity || 
        job.city.toLowerCase() === selectedCity.toLowerCase() ||
        (selectedCity.toLowerCase() === 'assú' && job.city.toLowerCase() === 'açu');

      const matchesModel = selectedWorkModel === 'TODOS' || job.workModel === selectedWorkModel;
      const matchesNoExperience = !onlyNoExperience || (
        job.contractType === 'ESTAGIO' ||
        job.contractType === 'JOVEM_APRENDIZ' ||
        /sem experiência|primeiro emprego|não exige experiência|jovem aprendiz|estágio/i.test(
          `${job.title} ${job.requirements || ''} ${job.description}`
        )
      );

      const matchesPcd = !onlyPcd || (
        Boolean(job.isPcd) ||
        /pcd|pessoa com deficiência|deficiência|afirmativa para pcd/i.test(
          `${job.title} ${job.requirements || ''} ${job.description}`
        )
      );

      return matchesQuery && matchesCity && matchesModel && matchesNoExperience && matchesPcd;
    }).sort((a, b) => {
      // 1. Vagas em destaque VIP sempre no topo
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // 2. Empresas com nome identificado têm prioridade; vagas confidenciais vão para o final
      const aConf = /confidencial/i.test(a.companyName);
      const bConf = /confidencial/i.test(b.companyName);
      if (!aConf && bConf) return -1;
      if (aConf && !bConf) return 1;

      return 0;
    });
  }, [jobs, searchQuery, selectedCity, selectedWorkModel, onlyNoExperience, onlyPcd, seoConfig]);

  // Lista visível com paginação progressiva para alta performance e Core Web Vitals
  const visibleJobs = useMemo(() => {
    return filteredJobs.slice(0, visibleCount);
  }, [filteredJobs, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  // Schema.org ItemList para o Google indexar a coleção de empregos da página
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: seoConfig ? seoConfig.h1 : 'Vagas de Emprego em Natal e no RN',
    itemListElement: visibleJobs.slice(0, 15).map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: job.publishedAt || job.createdAt,
        validThrough: job.expiresAt || undefined,
        employmentType: job.contractType === 'ESTAGIO' ? 'INTERN' : job.contractType === 'TEMPORARIO' ? 'TEMPORARY' : 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.companyName,
          logo: job.companyLogoUrl || 'https://natalvagas.com.br/assets/logo-natalvagas.jpg',
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.city,
            addressRegion: 'RN',
            addressCountry: 'BR',
          },
        },
        url: `https://natalvagas.com.br/vaga/${job.slug}`,
        directApply: true,
      },
    })),
  };

  // Schema BreadcrumbList para páginas de SEO programático
  const breadcrumbSchema = useMemo(() => {
    if (!seoConfig) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: 'https://natalvagas.com.br/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Vagas no RN',
          item: 'https://natalvagas.com.br/#vagas'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: seoConfig.h1,
          item: `https://natalvagas.com.br${seoConfig.path}`
        }
      ]
    };
  }, [seoConfig]);

  const topCities = ['Natal', 'Mossoró', 'Parnamirim', 'Macaíba', 'São Gonçalo do Amarante', 'Currais Novos', 'Caicó'];

  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-150">
      {/* Schema JSON-LD ItemList / JobPosting para Google for Jobs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Schema JSON-LD Breadcrumbs para páginas de categoria */}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}

      {/* Barra de Navegação */}
      <Navbar onOpenPostJob={() => setIsPostJobOpen(true)} />

      {/* Seção Hero: Landing Page Dedicada de SEO ou Banner Padrão com Busca */}
      {seoConfig ? (
        <SeoCategoryHero config={seoConfig} totalMatchingJobs={filteredJobs.length} />
      ) : (
        <HeroBanner 
          onSearch={handleSearch} 
          cities={[...new Set(jobs.map(job => job.city))].sort((a, b) => a.localeCompare(b, 'pt-BR'))} 
        />
      )}

      {/* Anúncio Banner de Topo (AdSense) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <AdPlaceholder format="horizontal" />
      </div>

      {/* Conteúdo Principal / Listagem de Vagas */}
      <main id="vagas" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Filtro Rápido por Polos de Cidades no RN */}
        <CityPills
          cities={topCities}
          selectedCity={selectedCity}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setVisibleCount(PAGE_SIZE);
          }}
          onlyNoExperience={onlyNoExperience}
          onToggleNoExperience={() => {
            setOnlyNoExperience(prev => !prev);
            setVisibleCount(PAGE_SIZE);
          }}
          onlyPcd={onlyPcd}
          onTogglePcd={() => {
            setOnlyPcd(prev => !prev);
            setVisibleCount(PAGE_SIZE);
          }}
        />

        {/* Barra de Filtros e Contagem */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              {seoConfig ? seoConfig.h1 : 'Oportunidades em Destaque no RN'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Mostrando <span className="font-bold text-brand-600 dark:text-brand-400">{visibleJobs.length}</span> de{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{filteredJobs.length}</span> vagas ativas no filtro
            </p>
          </div>

          {/* Filtro Rápido de Modalidade */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium self-stretch sm:self-auto overflow-x-auto no-scrollbar">
            {['TODOS', 'PRESENCIAL', 'HIBRIDO', 'REMOTO'].map((model) => (
              <button
                key={model}
                onClick={() => {
                  setSelectedWorkModel(model);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedWorkModel === model 
                    ? 'bg-brand-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {model === 'TODOS' ? 'Todos' : model.charAt(0) + model.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-50 rounded-xl mb-4" />
                <div className="h-8 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            {/* Grid Responsivo de Vagas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleApply}
                />
              ))}
            </div>

            {/* Paginação Progressiva / Carregar Mais */}
            {visibleJobs.length < filteredJobs.length && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-brand-500" />
                  <span>Carregar mais vagas ({filteredJobs.length - visibleJobs.length} restantes)</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-brand-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nenhuma vaga encontrada</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Não encontramos vagas com os filtros atuais. Tente buscar por outros termos ou limpar os filtros.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedWorkModel('TODOS');
                setOnlyNoExperience(false);
                if (seoConfig) navigate('/');
              }}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Ver todas as vagas do RN
            </button>
          </div>
        )}

        {/* Anúncio Banner de Meio de Página */}
        <div className="mt-12">
          <AdPlaceholder format="horizontal" />
        </div>

        {/* Seção das Comunidades Oficiais no WhatsApp / Telegram */}
        <WhatsAppCommunityBanner />

        {/* Vitrine de Cursos Recomendados */}
        <CourseRecommendations />

        {/* Seção de Dúvidas Frequentes (SEO FAQPage) */}
        <FaqSection />

      </main>

      {/* Modal de Anúncio de Vaga por Empresas (Lazy Loaded) */}
      <Suspense fallback={null}>
        {isPostJobOpen && (
          <PostJobModal 
            isOpen={isPostJobOpen} 
            onClose={() => setIsPostJobOpen(false)}
            onJobCreated={onJobCreated}
          />
        )}
      </Suspense>

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-lightBg text-brand-500">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

const JOBS_CACHE_KEY = 'natalvagas_jobs_cache_v2';

export const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const cached = sessionStorage.getItem(JOBS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore parse error
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => jobs.length === 0);

  // Carrega o catálogo consolidado assincronamente via Cloudflare Edge CDN
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/data/jobs.json');
      if (response.ok) {
        const data: Job[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data);
          try {
            sessionStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(data));
          } catch (e) {
            // ignore storage quota error
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar catálogo /data/jobs.json:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const location = useLocation();

  // Envia page_view para o Google Analytics a cada transição de rota no SPA
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('config', 'G-7L3CD25WSC', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Mescla overrides administrativos salvos localmente
  const effectiveJobs = useMemo(() => {
    try {
      const stored = localStorage.getItem('natalvagas_job_overrides');
      if (stored) {
        const overrides: Record<string, Partial<Job>> = JSON.parse(stored);
        return jobs.map(j => {
          const key = j.slug || String(j.id);
          if (overrides[key]) {
            return { ...j, ...overrides[key] };
          }
          return j;
        });
      }
    } catch {}
    return jobs;
  }, [jobs]);

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage jobs={effectiveJobs} isLoading={isLoading} onJobCreated={fetchJobs} />} />
          <Route path="/vaga/:slug" element={<JobDetailsPage jobs={effectiveJobs} isLoading={isLoading} onJobCreated={fetchJobs} />} />
          
          {/* Rotas de Programmatic SEO Dedicadas por Cidade e Categoria */}
          {SEO_LANDING_PAGES.map((page) => (
            <Route 
              key={page.slug}
              path={page.path}
              element={
                <HomePage
                  jobs={effectiveJobs}
                  isLoading={isLoading}
                  onJobCreated={fetchJobs}
                  seoCategorySlug={page.slug}
                />
              }
            />
          ))}

          <Route path="/criar-curriculo" element={<ResumeBuilder />} />
          <Route path="/gerador-curriculo" element={<Navigate to="/criar-curriculo" replace />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/sobre" element={<AboutUs />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/dicas-seguranca" element={<JobSafety />} />
          
          {/* Painel Interno Restrito */}
          <Route path="/editdev" element={<EditDevPage jobs={effectiveJobs} onJobUpdated={fetchJobs} />} />
          <Route path="/admin/cupons" element={<AdminCoupons />} />
          <Route path="/admin/coupons" element={<Navigate to="/admin/cupons" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Banner de Consentimento de Cookies (LGPD & Google AdSense) */}
      <CookieConsentBanner />

      {/* Banner PWA de Instalação no Celular */}
      <PwaInstallPrompt />
    </>
  );
};

export default App;
