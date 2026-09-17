import React, { useState } from 'react';
import { 
  X, Save, Building2, DollarSign, ShieldCheck, Sparkles, 
  Globe, Image as ImageIcon, Trash2, Check, FileText
} from 'lucide-react';
import { Job, WorkModel, ContractType, ApplicationChannel } from '../types/job';

interface AdminJobEditModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
}

export const AdminJobEditModal: React.FC<AdminJobEditModalProps> = ({
  job,
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(job.title || '');
  const [companyName, setCompanyName] = useState(job.companyName || '');
  const [companyLogoUrl, setCompanyLogoUrl] = useState(job.companyLogoUrl || '');
  const [flyerUrl, setFlyerUrl] = useState(job.sourceUrl && job.sourceUrl.includes('/assets/vagas/') ? job.sourceUrl : (job.companyLogoUrl && job.companyLogoUrl.includes('/assets/vagas/') ? job.companyLogoUrl : ''));
  const [isCompanyVerified, setIsCompanyVerified] = useState<boolean>(Boolean(job.isCompanyVerified));
  const [isFeatured, setIsFeatured] = useState<boolean>(Boolean(job.isFeatured));
  
  const [companyWebsite, setCompanyWebsite] = useState(job.companyWebsite || '');
  const [companyInstagram, setCompanyInstagram] = useState(job.companyInstagram || '');
  const [companyLinkedin, setCompanyLinkedin] = useState(job.companyLinkedin || '');
  const [companyDescription, setCompanyDescription] = useState(job.companyDescription || '');

  const [city, setCity] = useState(job.city || 'Natal');
  const [neighborhood, setNeighborhood] = useState(job.neighborhood || '');
  const [workModel, setWorkModel] = useState<WorkModel>(job.workModel || 'PRESENCIAL');
  const [contractType, setContractType] = useState<ContractType>(job.contractType || 'CLT');
  const [hideSalary, setHideSalary] = useState<boolean>(Boolean(job.hideSalary));
  const [salaryMin, setSalaryMin] = useState<string>(job.salaryMin ? String(job.salaryMin) : '');
  const [salaryMax, setSalaryMax] = useState<string>(job.salaryMax ? String(job.salaryMax) : '');

  const [description, setDescription] = useState(job.description || '');
  const [requirements, setRequirements] = useState(job.requirements || '');
  const [benefits, setBenefits] = useState(job.benefits || '');

  const [applicationChannel, setApplicationChannel] = useState<ApplicationChannel>(job.applicationChannel || 'EMAIL');
  const [applicationTarget, setApplicationTarget] = useState(job.applicationTarget || '');

  const [isPcd, setIsPcd] = useState<boolean>(Boolean(job.isPcd));
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompanyLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFlyerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFlyerUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Job = {
      ...job,
      title: title.trim(),
      companyName: companyName.trim(),
      companyLogoUrl: companyLogoUrl.trim() || undefined,
      isCompanyVerified,
      isFeatured,
      companyWebsite: companyWebsite.trim() || undefined,
      companyInstagram: companyInstagram.trim() || undefined,
      companyLinkedin: companyLinkedin.trim() || undefined,
      companyDescription: companyDescription.trim() || undefined,
      city: city.trim(),
      neighborhood: neighborhood.trim() || undefined,
      workModel,
      contractType,
      hideSalary,
      salaryMin: (!hideSalary && salaryMin) ? Number(salaryMin) : undefined,
      salaryMax: (!hideSalary && salaryMax) ? Number(salaryMax) : undefined,
      description: description.trim(),
      requirements: requirements.trim() || undefined,
      benefits: benefits.trim() || undefined,
      applicationChannel,
      applicationTarget: applicationTarget.trim(),
      isPcd,
      // Armazena flyer no sourceUrl ou campo customizado
      sourceUrl: flyerUrl.trim() || job.sourceUrl
    };

    onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Editar Vaga (Modo Administrador)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {job.title} — {job.companyName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Vaga atualizada com sucesso!</span>
            </div>
          )}

          {/* CHAVES MESTRAS: SELO DE EMPRESA VERIFICADA & DESTAQUE VIP */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-amber-50/60 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
              Controle de Status e Distintivos Oficiais
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Toggle Selo Empresa Verificada */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isCompanyVerified 
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-5 h-5 ${isCompanyVerified ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                      Empresa Verificada
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Auditor / Homologado
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isCompanyVerified}
                  onChange={(e) => setIsCompanyVerified(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </label>

              {/* Toggle Destaque VIP */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isFeatured 
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`w-5 h-5 ${isFeatured ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                      Destaque VIP
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Topo do portal
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                />
              </label>

              {/* Toggle Vaga PcD */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isPcd 
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-400/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">♿</span>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                      Inclusiva PcD
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Deficiência
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPcd}
                  onChange={(e) => setIsPcd(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Dados Principais: Cargo e Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Título / Cargo da Vaga *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Gerenciamento de Imagens: Logo Oficial vs Panfleto da Vaga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Logotipo Oficial da Empresa */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                Logotipo Limpo da Empresa (Quadrado)
              </span>

              {companyLogoUrl && !companyLogoUrl.includes('/assets/vagas/') ? (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={companyLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{companyLogoUrl}</span>
                  <button
                    type="button"
                    onClick={() => setCompanyLogoUrl('')}
                    className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="URL da imagem da logo (PNG, JPG)"
                    value={companyLogoUrl.includes('/assets/vagas/') ? '' : companyLogoUrl}
                    onChange={(e) => setCompanyLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <label className="block text-[11px] font-semibold text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                    Ou clique para fazer upload de arquivo da logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* 2. Panfleto / Flyer da Oportunidade */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Panfleto / Imagem do Anúncio (Flyer WhatsApp)
              </span>

              {flyerUrl ? (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={flyerUrl} alt="Flyer" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">Panfleto anexado</span>
                  <button
                    type="button"
                    onClick={() => setFlyerUrl('')}
                    className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="URL do panfleto / imagem da vaga"
                    value={flyerUrl}
                    onChange={(e) => setFlyerUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                    Ou clique para fazer upload do panfleto
                    <input type="file" accept="image/*" onChange={handleFlyerUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

          </div>

          {/* Redes Sociais e Site da Empresa */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-brand-600" />
              Canais Oficiais da Empresa (Exibidos na Página da Vaga)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Site Oficial</label>
                <input
                  type="url"
                  placeholder="https://empresa.com.br"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Instagram</label>
                <input
                  type="text"
                  placeholder="@empresa"
                  value={companyInstagram}
                  onChange={(e) => setCompanyInstagram(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">LinkedIn</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  value={companyLinkedin}
                  onChange={(e) => setCompanyLinkedin(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Sobre a Empresa / Histórico</label>
              <textarea
                rows={2}
                placeholder="Breve resumo sobre a empresa contratante no RN..."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Localização, Modalidade e Contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cidade (RN)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Modalidade</label>
              <select
                value={workModel}
                onChange={(e) => setWorkModel(e.target.value as WorkModel)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="PRESENCIAL">Presencial</option>
                <option value="HIBRIDO">Híbrido</option>
                <option value="REMOTO">Remoto</option>
                <option value="NAO_INFORMADO">A Combinar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contrato</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="CLT">CLT</option>
                <option value="ESTAGIO">Estágio</option>
                <option value="JOVEM_APRENDIZ">Jovem Aprendiz</option>
                <option value="PJ">PJ</option>
                <option value="TEMPORARIO">Temporário</option>
              </select>
            </div>
          </div>

          {/* Salário */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Remuneração Salarial
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={hideSalary}
                  onChange={(e) => setHideSalary(e.target.checked)}
                  className="rounded text-brand-600"
                />
                <span>Salário a Combinar (Ocultar valor)</span>
              </label>
            </div>

            {!hideSalary && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Salário Mínimo (R$)</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Salário Máximo (R$)</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo: Descrição, Requisitos e Benefícios */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Descrição Completa da Vaga *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Requisitos e Qualificações
                </label>
                <textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Benefícios Oferecidos
                </label>
                <textarea
                  rows={3}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Candidatura (Canal de envio) */}
          <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-slate-800/80 border border-brand-100 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-800 dark:text-brand-300 block">
              Canal Oficial de Candidatura
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Canal</label>
                <select
                  value={applicationChannel}
                  onChange={(e) => setApplicationChannel(e.target.value as ApplicationChannel)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="EMAIL">E-mail</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LINK">Link Externo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">
                  {applicationChannel === 'EMAIL' ? 'E-mail para envio' : applicationChannel === 'WHATSAPP' ? 'Número WhatsApp (ex: 84988887777)' : 'Link de inscrição'}
                </label>
                <input
                  type="text"
                  required
                  value={applicationTarget}
                  onChange={(e) => setApplicationTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Rodapé com Botões */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações da Vaga</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
