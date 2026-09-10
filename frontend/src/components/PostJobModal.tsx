import React, { useState, useEffect } from 'react';
import { X, Building2, DollarSign, Send, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Category, WorkModel, ContractType, ApplicationChannel } from '../types/job';
import axios from 'axios';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados do Formulário
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [city, setCity] = useState('Natal');
  const [neighborhood, setNeighborhood] = useState('');
  const [workModel, setWorkModel] = useState<WorkModel>('PRESENCIAL');
  const [contractType, setContractType] = useState<ContractType>('CLT');
  const [hideSalary, setHideSalary] = useState(true);
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [applicationChannel, setApplicationChannel] = useState<ApplicationChannel>('EMAIL');
  const [applicationTarget, setApplicationTarget] = useState('');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);

  // Carregar Categorias
  useEffect(() => {
    if (isOpen) {
      axios.get('/api/categories')
        .then(res => setCategories(res.data))
        .catch(err => console.error('Erro ao carregar categorias:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !companyName.trim() || !description.trim() || !applicationTarget.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        companyName: companyName.trim(),
        categoryId: categoryId ? Number(categoryId) : null,
        city: city.trim(),
        state: 'RN',
        neighborhood: neighborhood.trim() || null,
        workModel,
        contractType,
        hideSalary,
        salaryMin: (!hideSalary && salaryMin) ? Number(salaryMin) : null,
        salaryMax: (!hideSalary && salaryMax) ? Number(salaryMax) : null,
        description: description.trim(),
        requirements: requirements.trim() || null,
        benefits: benefits.trim() || null,
        applicationChannel,
        applicationTarget: applicationTarget.trim(),
        isFeatured: isFeatured,
        sourceUrl: 'https://natalvagas.com.br'
      };

      const response = await axios.post('/api/jobs', payload);
      if (response.data && response.data.slug) {
        setSuccessSlug(response.data.slug);
        onJobCreated();
      }
    } catch (err: any) {
      console.error('Erro ao publicar vaga:', err);
      setErrorMessage(err.response?.data?.message || 'Falha ao cadastrar a vaga. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessSlug(null);
    setTitle('');
    setCompanyName('');
    setNeighborhood('');
    setDescription('');
    setRequirements('');
    setBenefits('');
    setApplicationTarget('');
    setHideSalary(true);
    setSalaryMin('');
    setSalaryMax('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="p-6 bg-gradient-to-r from-brand-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                Anunciar Oportunidade
              </h2>
              <p className="text-xs text-slate-500">
                Publique gratuitamente para candidatos de Natal e toda Região Metropolitana
              </p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal de Sucesso */}
        {successSlug ? (
          <div className="p-8 text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Vaga Publicada com Sucesso!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
              Sua vaga já foi autenticada e está visível para milhares de candidatos em Natal e região metropolitana.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-brand-700 transition-all"
              >
                Ver no Mural de Vagas
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Cadastro */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
            
            {errorMessage && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Linha 1: Título e Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cargo / Título da Vaga *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Auxiliar de Almoxarifado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome da Empresa ou Recrutador *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Comercial Potiguar (ou Confidencial)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Linha 2: Cidade, Bairro e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cidade (RN) *
                </label>
                <select 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Natal">Natal</option>
                  <option value="Parnamirim">Parnamirim</option>
                  <option value="São Gonçalo do Amarante">São Gonçalo do Amarante</option>
                  <option value="Macaíba">Macaíba</option>
                  <option value="Ceará-Mirim">Ceará-Mirim</option>
                  <option value="Extremoz">Extremoz</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bairro
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Alecrim, Ponta Negra..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Área / Categoria
                </label>
                <select 
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Selecione uma área...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 3: Modelo e Regime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Modalidade *
                </label>
                <select 
                  value={workModel}
                  onChange={(e) => setWorkModel(e.target.value as WorkModel)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="HIBRIDO">Híbrido</option>
                  <option value="REMOTO">Remoto (Home Office)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo de Contrato *
                </label>
                <select 
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as ContractType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="CLT">CLT (Carteira Assinada)</option>
                  <option value="PJ">PJ (Pessoa Jurídica)</option>
                  <option value="ESTAGIO">Estágio</option>
                  <option value="TEMPORARIO">Temporário</option>
                  <option value="JOVEM_APRENDIZ">Jovem Aprendiz</option>
                </select>
              </div>
            </div>

            {/* Linha 4: Salário */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Remuneração
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={hideSalary}
                    onChange={(e) => setHideSalary(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Salário a Combinar / Ocultar valor</span>
                </label>
              </div>

              {!hideSalary && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Valor Mínimo (R$)</label>
                    <input 
                      type="number"
                      placeholder="1518"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Valor Máximo (R$ opcional)</label>
                    <input 
                      type="number"
                      placeholder="2000"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Linha 5: Descrição da Vaga */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Descrição das Atividades *
              </label>
              <textarea 
                required
                rows={3}
                placeholder="Descreva o dia a dia da função e as principais atribuições..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>

            {/* Linha 6: Requisitos e Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Requisitos & Qualificações
                </label>
                <textarea 
                  rows={2}
                  placeholder="• Ensino médio completo&#10;• Experiência com público"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Benefícios Oferecidos
                </label>
                <textarea 
                  rows={2}
                  placeholder="• Vale Transporte&#10;• Vale Alimentação"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:outline-none transition-all text-xs"
                />
              </div>
            </div>

            {/* Linha 7: Como se Candidatar (Contato do RH) */}
            <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 space-y-3">
              <span className="block text-xs font-bold text-brand-800 uppercase">
                Onde o candidato deve enviar o currículo? *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Canal de Envio</label>
                  <select 
                    value={applicationChannel}
                    onChange={(e) => setApplicationChannel(e.target.value as ApplicationChannel)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="EMAIL">E-mail de RH</option>
                    <option value="WHATSAPP">WhatsApp do RH</option>
                    <option value="LINK">Link / Site de Vagas</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-600 mb-1">
                    {applicationChannel === 'EMAIL' ? 'E-mail para receber currículos' : applicationChannel === 'WHATSAPP' ? 'Número WhatsApp com DDD (ex: 84988887777)' : 'URL do formulário'}
                  </label>
                  <input 
                    type={applicationChannel === 'EMAIL' ? 'email' : 'text'}
                    required
                    placeholder={applicationChannel === 'EMAIL' ? 'curriculos@suaempresa.com.br' : applicationChannel === 'WHATSAPP' ? '84988887777' : 'https://empresa.gupy.io'}
                    value={applicationTarget}
                    onChange={(e) => setApplicationTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Linha 8: Escolha do Tipo de Anúncio / Monetização B2B */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
              <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Escolha o Plano de Divulgação da Vaga
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Opção Gratuita */}
                <label className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  !isFeatured ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={!isFeatured} 
                        onChange={() => setIsFeatured(false)} 
                        className="text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-800">Anúncio Padrão</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Grátis</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Publicação no catálogo com filtros por cidade e cargo.</p>
                </label>

                {/* Opção Destaque VIP */}
                <label className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all relative ${
                  isFeatured ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={isFeatured} 
                        onChange={() => setIsFeatured(true)} 
                        className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        Destaque VIP
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">R$ 29,90</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2">Fixada no topo do portal com selo dourado + Disparo VIP no WhatsApp.</p>
                </label>
              </div>

              {/* Box de Pagamento do Destaque VIP via Pix */}
              {isFeatured && (
                <div className="p-4 bg-white rounded-xl border border-amber-300 shadow-xs space-y-3 mt-3 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent('00020126360014br.gov.bcb.pix0114+5584992344922520400005303986540529.905802BR5911NATAL VAGAS6005NATAL62070503***630485D3')}`}
                      alt="QR Code Pix R$ 29,90"
                      className="w-24 h-24 object-contain rounded-lg border border-slate-200"
                    />
                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <span className="text-xs font-bold text-slate-800 block">Ativação do Destaque VIP (R$ 29,90)</span>
                      <p className="text-[11px] text-slate-500">Escaneie o QR Code no app do banco ou use a chave telefone: <strong>(84) 99234-4922</strong></p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('00020126360014br.gov.bcb.pix0114+5584992344922520400005303986540529.905802BR5911NATAL VAGAS6005NATAL62070503***630485D3');
                          setCopiedPix(true);
                          setTimeout(() => setCopiedPix(false), 3000);
                        }}
                        className="mt-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {copiedPix ? 'Código Pix Copiado!' : 'Copiar Pix Copia e Cola (R$ 29,90)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publicar Vaga Imediatamente</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
