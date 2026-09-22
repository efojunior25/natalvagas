import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Lock, Search, 
  Sparkles, Edit3, ExternalLink, LogOut, CheckCircle2, 
  Download, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Job } from '../types/job';
import { AdminJobEditModal } from '../components/AdminJobEditModal';

import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';

interface EditDevPageProps {
  jobs: Job[];
  onJobUpdated?: () => void;
}

export const STORAGE_JOB_OVERRIDES = 'natalvagas_job_overrides';

export const EditDevPage: React.FC<EditDevPageProps> = ({ jobs, onJobUpdated }) => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Estado de Gerenciamento de Vagas
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'FEATURED' | 'UNVERIFIED'>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('TODAS');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Overrides locais para persistência imediata
  const [overrides, setOverrides] = useState<Record<string, Partial<Job>>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_JOB_OVERRIDES);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Modal de edição de vaga
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Meta tag de proteção contra robôs
  useEffect(() => {
    document.title = 'Painel Interno Dev — Natal Vagas';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive');

    return () => {
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
    };
  }, []);

  // Consolidação das vagas com overrides
  const consolidatedJobs = useMemo(() => {
    return jobs.map(j => {
      const key = j.slug || String(j.id);
      if (overrides[key]) {
        return { ...j, ...overrides[key] };
      }
      return j;
    });
  }, [jobs, overrides]);

  const isAuth = user?.role === 'EDITDEV';

  const handleLogout = () => {
    logout();
  };

  // Toggle rápido de Selo de Empresa Verificada
  const handleToggleVerified = (job: Job) => {
    const key = job.slug || String(job.id);
    const newStatus = !job.isCompanyVerified;
    const newOverrides = {
      ...overrides,
      [key]: {
        ...(overrides[key] || {}),
        isCompanyVerified: newStatus
      }
    };
    setOverrides(newOverrides);
    try {
      localStorage.setItem(STORAGE_JOB_OVERRIDES, JSON.stringify(newOverrides));
    } catch {}
    if (onJobUpdated) onJobUpdated();
  };

  // Toggle rápido de Destaque VIP
  const handleToggleFeatured = (job: Job) => {
    const key = job.slug || String(job.id);
    const newStatus = !job.isFeatured;
    const newOverrides = {
      ...overrides,
      [key]: {
        ...(overrides[key] || {}),
        isFeatured: newStatus
      }
    };
    setOverrides(newOverrides);
    try {
      localStorage.setItem(STORAGE_JOB_OVERRIDES, JSON.stringify(newOverrides));
    } catch {}
    if (onJobUpdated) onJobUpdated();
  };

  // Salvar alterações vindas do modal completo
  const handleSaveJob = (updatedJob: Job) => {
    const key = updatedJob.slug || String(updatedJob.id);
    const newOverrides = {
      ...overrides,
      [key]: updatedJob
    };
    setOverrides(newOverrides);
    try {
      localStorage.setItem(STORAGE_JOB_OVERRIDES, JSON.stringify(newOverrides));
    } catch {}
    if (onJobUpdated) onJobUpdated();
  };

  // Exportar jobs.json consolidado para backup ou deploy
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(consolidatedJobs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-atualizado-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtro de Vagas
  const filteredJobs = useMemo(() => {
    return consolidatedJobs.filter(job => {
      const matchesSearch = 
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = cityFilter === 'TODAS' || job.city.toLowerCase() === cityFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === 'VERIFIED') matchesStatus = Boolean(job.isCompanyVerified);
      if (statusFilter === 'FEATURED') matchesStatus = Boolean(job.isFeatured);
      if (statusFilter === 'UNVERIFIED') matchesStatus = !job.isCompanyVerified;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [consolidatedJobs, searchQuery, statusFilter, cityFilter]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;

  // Contadores
  const verifiedCount = useMemo(() => consolidatedJobs.filter(j => j.isCompanyVerified).length, [consolidatedJobs]);
  const featuredCount = useMemo(() => consolidatedJobs.filter(j => j.isFeatured).length, [consolidatedJobs]);

  // Cidades únicas para o filtro
  const cities = useMemo(() => {
    const set = new Set<string>();
    consolidatedJobs.forEach(j => { if (j.city) set.add(j.city); });
    return Array.from(set).sort();
  }, [consolidatedJobs]);

  // TELA 1: LOGIN EDITDEV COM MFA
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-600" />

          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-brand-400 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Painel Restrito EDITDEV
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Acesso exclusivo à conta operacional EDITDEV com autenticação em duas etapas (MFA).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Fazer Login com MFA</span>
          </button>

          <div className="pt-2 border-t border-slate-800/80">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Voltar à página inicial
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          title="Login EDITDEV"
          subtitle="Informe suas credenciais corporativas @natalvagas.com.br."
        />
      </div>
    );
  }

  // TELA 2: PAINEL EDITDEV DE EDIÇÃO DE VAGAS
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      {/* Barra de Navegação Superior do Painel */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black shadow-xs">
            NV
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
              <span>Painel de Controle de Vagas</span>
              <span className="text-[10px] uppercase font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full">
                EDITDEV MFA
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">
              Sessão: <strong className="text-slate-300">{user?.email || 'editdev@natalvagas.com.br'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportJson}
            title="Baixar jobs.json consolidado com todas as edições"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Exportar jobs.json</span>
          </button>

          <Link
            to="/"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Ver Site Público</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo do Painel */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6 flex-1">
        
        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total de Vagas</span>
              <span className="text-2xl sm:text-3xl font-black">{consolidatedJobs.length}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-950/80 border border-brand-800/60 text-brand-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Empresas Verificadas</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-400">{verifiedCount}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-800/60 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Destaques VIP</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">{featuredCount}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* BARRA DE PESQUISA & FILTROS */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* Input de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Buscar por cargo, empresa, bairro ou cidade..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="VERIFIED">Apenas Empresas Verificadas (🛡️)</option>
              <option value="FEATURED">Apenas Vagas VIP (⭐)</option>
              <option value="UNVERIFIED">Sem Selo Verificado</option>
            </select>

            {/* Filtro de Cidade */}
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas as Cidades</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Encontradas: <strong>{filteredJobs.length}</strong> vagas</span>
            <span>Página {page} de {totalPages}</span>
          </div>
        </div>

        {/* LISTAGEM DE VAGAS EM TABELA RESPONSIVA */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cargo & Empresa</th>
                  <th className="py-3 px-4">Local</th>
                  <th className="py-3 px-4 text-center">Selo Verificado</th>
                  <th className="py-3 px-4 text-center">Destaque VIP</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedJobs.map((job) => {
                  const isVerified = Boolean(job.isCompanyVerified);
                  const isVip = Boolean(job.isFeatured);

                  return (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Cargo & Empresa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {job.companyLogoUrl && !job.companyLogoUrl.includes('/assets/vagas/') ? (
                              <img src={job.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-slate-500 text-sm">
                                {job.companyName.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-xs sm:text-sm truncate max-w-xs sm:max-w-md">
                              {job.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                              <span>{job.companyName}</span>
                              {isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Local */}
                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        <span>{job.city}/RN</span>
                        {job.neighborhood && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                            {job.neighborhood}
                          </span>
                        )}
                      </td>

                      {/* Switch Selo Verificado */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVerified(job)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isVerified 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'Ativo' : 'Inativo'}</span>
                        </button>
                      </td>

                      {/* Switch Destaque VIP */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(job)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isVip 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isVip ? 'VIP Ativo' : 'Padrão'}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingJob(job)}
                            className="p-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Editar todos os campos da vaga"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          <Link
                            to={`/vaga/${job.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Visualizar vaga no site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Mostrando {paginatedJobs.length} de {filteredJobs.length} vagas</span>
            
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                Anterior
              </button>
              <span className="px-2 font-bold text-white">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Modal de Edição de Vaga */}
      {editingJob && (
        <AdminJobEditModal
          job={editingJob}
          isOpen={Boolean(editingJob)}
          onClose={() => setEditingJob(null)}
          onSave={handleSaveJob}
        />
      )}

      {/* Rodapé Interno */}
      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Natal Vagas • Ambiente Interno EDITDEV
      </footer>

    </div>
  );
};
