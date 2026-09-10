import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { JobCard } from './components/JobCard';
import { JobModal } from './components/JobModal';
import { PostJobModal } from './components/PostJobModal';
import { AdPlaceholder } from './components/AdPlaceholder';
import { Footer } from './components/Footer';
import { Job } from './types/job';
import { INITIAL_REAL_JOBS } from './data/initialJobs';
import { Sparkles, AlertCircle, Loader2, PlusCircle } from 'lucide-react';
import axios from 'axios';

import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { AboutUs } from './pages/AboutUs';
import { Contact } from './pages/Contact';
import { JobSafety } from './pages/JobSafety';

interface HomePageProps {
  jobs: Job[];
  isLoading: boolean;
  onJobCreated: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ jobs, isLoading, onJobCreated }) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkModel, setSelectedWorkModel] = useState<string>('TODOS');

  // Trata abertura direta por URL (/vaga/:slug)
  useEffect(() => {
    if (slug) {
      const found = jobs.find(j => j.slug === slug || String(j.id) === slug);
      if (found) {
        setActiveJob(found);
        document.title = `${found.title} — ${found.companyName} | Natal Vagas`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute(
            'content',
            `Vaga de ${found.title} na empresa ${found.companyName} em ${found.city}/RN. Requisitos, benefícios e link oficial para candidatura no Natal Vagas.`
          );
        }
      }
    } else {
      setActiveJob(null);
      document.title = 'Natal Vagas — Vagas de Emprego em Natal e Região Metropolitana (RN)';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'Encontre mais de 120 vagas de emprego reais e atualizadas em Natal, Mossoró, Parnamirim e todo o RN. Conectamos candidatos a empresas de forma 100% gratuita.'
        );
      }
    }
  }, [slug, jobs]);

  const handleSearch = (query: string, city: string) => {
    setSearchQuery(query);
    setSelectedCity(city);
  };

  const handleApply = (job: Job) => {
    navigate(`/vaga/${job.slug}`);
  };

  const handleCloseModal = () => {
    setActiveJob(null);
    if (slug) {
      navigate('/');
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status !== 'APPROVED' || (job.expiresAt && Date.parse(job.expiresAt) < Date.now())) return false;
      const matchesQuery = 
        !searchQuery || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.neighborhood && job.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCity = !selectedCity || job.city.toLowerCase() === selectedCity.toLowerCase();
      const matchesModel = selectedWorkModel === 'TODOS' || job.workModel === selectedWorkModel;

      return matchesQuery && matchesCity && matchesModel;
    });
  }, [jobs, searchQuery, selectedCity, selectedWorkModel]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg selection:bg-brand-500 selection:text-white">
      {/* Barra de Navegação */}
      <Navbar onOpenPostJob={() => setIsPostJobOpen(true)} />

      {/* Seção Hero com Banner e Busca */}
      <HeroBanner 
        onSearch={handleSearch} 
        cities={[...new Set(jobs.map(job => job.city))].sort((a, b) => a.localeCompare(b, 'pt-BR'))} 
      />

      {/* Anúncio Banner de Topo (AdSense) */}
      <div className="max-w-5xl mx-auto px-4 w-full">
        <AdPlaceholder format="horizontal" />
      </div>

      {/* Conteúdo Principal / Listagem de Vagas */}
      <main id="vagas" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Barra de Filtros e Contagem */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Oportunidades no Rio Grande do Norte
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Exibindo <span className="font-bold text-brand-600">{filteredJobs.length}</span> anúncios de vagas no RN
            </p>
          </div>

          {/* Filtro Rápido de Modalidade */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-medium self-stretch sm:self-auto overflow-x-auto">
            {['TODOS', 'PRESENCIAL', 'HIBRIDO', 'REMOTO'].map((model) => (
              <button
                key={model}
                onClick={() => setSelectedWorkModel(model)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  selectedWorkModel === model 
                    ? 'bg-brand-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {model === 'TODOS' ? 'Todos' : model.charAt(0) + model.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
            <p className="text-sm">Carregando oportunidades atualizadas em Natal...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredJobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onApply={handleApply} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Nenhuma vaga encontrada</h3>
            <p className="text-sm text-slate-500 mt-1">
              Tente buscar por termos mais genéricos ou limpe os filtros de cidade.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedWorkModel('TODOS');
              }}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Anúncio Banner de Meio/Fim da Página */}
        <div className="mt-8">
          <AdPlaceholder format="horizontal" />
        </div>

        {/* Banner Institucional de Novas Oportunidades */}
        <div className="mt-10 relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Para Empresas & Recrutadores
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Precisa contratar profissionais em Natal e Região?
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Divulgue suas vagas diretamente no Natal Vagas de forma rápida. Alcance candidatos qualificados em todos os bairros da capital e cidades vizinhas.
            </p>
          </div>

          <button
            onClick={() => setIsPostJobOpen(true)}
            className="shrink-0 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Divulgar Vaga Gratuitamente</span>
          </button>
        </div>

      </main>

      {/* Modal de Detalhes da Vaga */}
      <JobModal 
        job={activeJob} 
        onClose={handleCloseModal} 
      />

      {/* Modal de Anúncio de Vaga por Empresas */}
      <PostJobModal 
        isOpen={isPostJobOpen} 
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={onJobCreated}
      />

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_REAL_JOBS);
  const [isLoading] = useState<boolean>(false);

  // Tenta sincronizar com o backend Spring Boot em tempo real
  const fetchJobs = useCallback(async () => {
    try {
      const response = await axios.get('/api/jobs', {
        params: { size: 50 },
        headers: { 'Accept': 'application/json' }
      });
      if (response.data && Array.isArray(response.data.content) && response.data.content.length > 0) {
        const remote: Job[] = response.data.content;
        setJobs([...INITIAL_REAL_JOBS, ...remote.filter(job =>
          !INITIAL_REAL_JOBS.some(local => local.id === job.id || local.applicationTarget === job.applicationTarget)
        )]);
      }
    } catch (err) {
      console.log('Utilizando catálogo local de vagas reais.');
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <Routes>
      <Route path="/" element={<HomePage jobs={jobs} isLoading={isLoading} onJobCreated={fetchJobs} />} />
      <Route path="/vaga/:slug" element={<HomePage jobs={jobs} isLoading={isLoading} onJobCreated={fetchJobs} />} />
      <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
      <Route path="/termos-de-uso" element={<TermsOfUse />} />
      <Route path="/sobre" element={<AboutUs />} />
      <Route path="/contato" element={<Contact />} />
      <Route path="/dicas-seguranca" element={<JobSafety />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
