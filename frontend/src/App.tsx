import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { JobCard } from './components/JobCard';
import { JobModal } from './components/JobModal';
import { PostJobModal } from './components/PostJobModal';
import { AdPlaceholder } from './components/AdPlaceholder';
import { Footer } from './components/Footer';
import { Job } from './types/job';
import { Sparkles, AlertCircle, Loader2, PlusCircle } from 'lucide-react';
import axios from 'axios';

export const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkModel, setSelectedWorkModel] = useState<string>('TODOS');
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState<boolean>(false);

  // Carregar vagas reais do Backend Spring Boot
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/jobs', {
        params: { size: 50 }
      });
      if (response.data && response.data.content) {
        setJobs(response.data.content);
      }
    } catch (err) {
      console.error('Erro ao buscar vagas do backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = (query: string, city: string) => {
    setSearchQuery(query);
    setSelectedCity(city);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
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
      <HeroBanner onSearch={handleSearch} />

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
              Oportunidades Reais em Destaque
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Exibindo <span className="font-bold text-brand-600">{filteredJobs.length}</span> vagas ativas em Natal e região metropolitana
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
                onApply={(j) => setActiveJob(j)} 
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
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
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
        onClose={() => setActiveJob(null)} 
      />

      {/* Modal de Anúncio de Vaga por Empresas */}
      <PostJobModal 
        isOpen={isPostJobOpen} 
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={fetchJobs}
      />

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

export default App;
