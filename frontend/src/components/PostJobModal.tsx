import React, { useState, useEffect } from 'react';
import { X, Building2, DollarSign, Send, CheckCircle, AlertCircle, Loader2, Sparkles, Upload, Image as ImageIcon, Trash2, Check, Copy, Clock, ShieldCheck, RefreshCw, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Category, WorkModel, ContractType, ApplicationChannel } from '../types/job';
import { generateUniqueTxid, buildPixEMV } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import axios from 'axios';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Administrativo & Financeiro', slug: 'administrativo' },
  { id: 2, name: 'Atendimento & Vendas', slug: 'vendas' },
  { id: 3, name: 'Saúde, Clínica & Farmácia', slug: 'saude' },
  { id: 4, name: 'Tecnologia, TI & Design', slug: 'tecnologia' },
  { id: 5, name: 'Logística, Estoque & Operacional', slug: 'logistica' },
  { id: 6, name: 'Educação & Estágio', slug: 'estagios' },
  { id: 7, name: 'Gastronomia, Bares & Restaurantes', slug: 'gastronomia' },
  { id: 8, name: 'Construção Civil & Manutenção', slug: 'construcao' },
  { id: 9, name: 'Serviços Gerais & Segurança', slug: 'servicos-gerais' },
  { id: 10, name: 'Outros Setores', slug: 'outros' }
];

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const { user, isAuthenticated } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados do Formulário
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (user?.name && !companyName) {
      setCompanyName(user.name);
    }
  }, [user]);
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyInstagram, setCompanyInstagram] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
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
  
  // Destaque VIP (30 Dias) & Ativação 100% Automática via Pix Único
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [isVipApproved, setIsVipApproved] = useState<boolean>(false);
  const [isCheckingPix, setIsCheckingPix] = useState<boolean>(false);
  const [uniqueTxid, setUniqueTxid] = useState<string>('');
  const [uniqueEmvCode, setUniqueEmvCode] = useState<string>('');
  const [pixStatusNotice, setPixStatusNotice] = useState<{ type: 'pending' | 'success' | 'error'; message: string } | null>(null);

  // Carregar Categorias
  useEffect(() => {
    if (isOpen) {
      axios.get('/api/categories')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setCategories(res.data);
          }
        })
        .catch(() => {
          setCategories(DEFAULT_CATEGORIES);
        });
    }
  }, [isOpen]);

  // Função para gerar QR Code Pix Único com txid exclusivo para este anúncio
  const generateNewPixCharge = () => {
    const txid = generateUniqueTxid('VIP');
    const emv = buildPixEMV({
      pixKey: 'pix@natalvagas.com.br',
      amount: 29.90,
      txid,
      merchantName: 'NATAL VAGAS',
      merchantCity: 'NATAL'
    });
    setUniqueTxid(txid);
    setUniqueEmvCode(emv);
    setIsVipApproved(false);
    setPixStatusNotice(null);
  };

  // Quando o usuário seleciona Destaque VIP, garante que existe uma cobrança Pix única
  useEffect(() => {
    if (isFeatured && !uniqueTxid) {
      generateNewPixCharge();
    }
  }, [isFeatured, uniqueTxid]);

  // Polling automático para confirmação em tempo real de pagamento Pix VIP pelo txid exclusivo
  useEffect(() => {
    if (!isOpen || !isFeatured || isVipApproved || !uniqueTxid) return;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/pix/status/${uniqueTxid}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'approved' && isMounted) {
            setIsVipApproved(true);
            setPixStatusNotice({
              type: 'success',
              message: 'Pagamento reconhecido pelo sistema bancário! Destaque VIP de 30 dias ativado.'
            });
          }
        }
      } catch (err) {
        // Silencioso para não interromper a navegação
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, isFeatured, isVipApproved, uniqueTxid]);

  // Manipulador de upload de logo com redimensionamento automático via Canvas
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem da logomarca deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 180;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          setCompanyLogoUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Verificação manual do Pix (consulta real no endpoint do txid exclusivo sem bypass falso)
  const handleCheckPixManual = async () => {
    if (!uniqueTxid) return;
    setIsCheckingPix(true);
    setPixStatusNotice(null);

    try {
      const res = await fetch(`/api/payments/pix/status/${uniqueTxid}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'approved') {
          setIsVipApproved(true);
          setIsCheckingPix(false);
          setPixStatusNotice({
            type: 'success',
            message: 'Pagamento reconhecido pelo sistema bancário! Destaque VIP de 30 dias ativado.'
          });
          return;
        }
      }

      // Pagamento ainda não compensado no banco
      setIsCheckingPix(false);
      setPixStatusNotice({
        type: 'pending',
        message: 'Pagamento ainda não identificado no sistema bancário. Se você já transferiu, aguarde alguns instantes (normalmente de 5 a 30 segundos) e clique novamente.'
      });
    } catch (e) {
      setIsCheckingPix(false);
      setPixStatusNotice({
        type: 'error',
        message: 'Não foi possível consultar o status do Pix no momento. O sistema continuará verificando automaticamente em segundo plano.'
      });
    }
  };

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
        companyLogoUrl: companyLogoUrl.trim() || null,
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
        isCompanyVerified: isFeatured ? isVipApproved : false,
        companyWebsite: companyWebsite.trim() || null,
        companyInstagram: companyInstagram.trim() || null,
        companyLinkedin: companyLinkedin.trim() || null,
        companyDescription: companyDescription.trim() || null,
        featuredDays: isFeatured ? 30 : 0,
        isVipApproved: isFeatured ? isVipApproved : false,
        featuredTxid: isFeatured ? uniqueTxid : undefined,
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
    setCompanyLogoUrl('');
    setNeighborhood('');
    setDescription('');
    setRequirements('');
    setBenefits('');
    setApplicationTarget('');
    setHideSalary(true);
    setSalaryMin('');
    setSalaryMax('');
    setIsFeatured(false);
    setIsVipApproved(false);
    setUniqueTxid('');
    setUniqueEmvCode('');
    setPixStatusNotice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden max-h-[92vh] flex flex-col animate-scaleUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                Anunciar Oportunidade
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Publique gratuitamente para candidatos de Natal e de todo o RN
              </p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal de Sucesso */}
        {successSlug ? (
          <div className="p-8 text-center my-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Vaga Publicada com Sucesso!
            </h3>
            {isFeatured && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>⭐ Vaga com Destaque VIP Ativado por 30 Dias!</span>
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Sua vaga já foi processada e está visível para milhares de profissionais de Natal e região metropolitana.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Ver no Mural de Vagas
              </button>
              <a
                href={`https://wa.me/5584921869397?text=${encodeURIComponent(`Olá! Acabei de cadastrar uma nova oportunidade no Natal Vagas:\n\n*${title}* na empresa *${companyName}*\nCidade: ${city}/RN\nCanal: ${applicationTarget}${isFeatured ? '\n⭐ Com Destaque VIP de 30 Dias' : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Avisar Equipe no WhatsApp</span>
              </a>
            </div>
          </div>
        ) : !isAuthenticated ? (
          /* Portal da Empresa - Login/Cadastro Obrigatório */
          <div className="p-6 sm:p-10 text-center flex flex-col items-center justify-center my-auto space-y-5">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-md border border-brand-200 dark:border-brand-800">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 text-xs font-black uppercase tracking-wider">
                Área Exclusiva de Recrutamento
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Identifique sua Empresa para Anunciar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Para manter a credibilidade do mural e garantir a segurança dos candidatos de Natal e região, é necessário acessar ou cadastrar sua empresa.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2.5">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Entrar ou Cadastrar Empresa Gratuitamente</span>
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cadastro em 10 segundos • 100% gratuito para publicação de vagas
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-left text-xs max-w-md w-full space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Vantagens para sua Empresa:</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                <li>Divulgação nos canais oficiais e redes do Natal Vagas</li>
                <li>Recebimento direto de currículos no e-mail ou WhatsApp da empresa</li>
                <li>Painel para gerenciar, editar ou pausar suas vagas</li>
                <li>Selo de empresa verificada para atrair os melhores talentos</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Formulário de Cadastro */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
            
            {/* Informações da Empresa Conectada */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Publicando como: <strong>{user?.name}</strong> ({user?.email})</span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md text-emerald-800 dark:text-emerald-300">
                Empresa Autenticada
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Linha 1: Título e Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Cargo / Título da Vaga *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Auxiliar de Almoxarifado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nome da Empresa ou Recrutador *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Comercial Potiguar (ou Confidencial)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* REQUISITO 1: Inserção da Logomarca da Empresa */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Logomarca da Empresa (Opcional)
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLogoInputType('upload')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      logoInputType === 'upload' 
                        ? 'bg-brand-600 text-white' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputType('url')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      logoInputType === 'url' 
                        ? 'bg-brand-600 text-white' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Link da Imagem (URL)
                  </button>
                </div>
              </div>

              {companyLogoUrl ? (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={companyLogoUrl} alt="Pré-visualização da Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">Logotipo carregado com sucesso</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Visível nos cards de vaga e modal
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompanyLogoUrl('')}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remover logotipo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {logoInputType === 'upload' ? (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-xl cursor-pointer bg-white dark:bg-slate-800/80 transition-all group">
                      <Upload className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors mb-1" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        Clique para escolher a logo da empresa (PNG, JPG, WEBP)
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Otimizada automaticamente para exibição perfeita nos cards
                      </span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                        onChange={handleLogoUpload}
                        className="hidden" 
                      />
                    </label>
                  ) : (
                    <input 
                      type="url"
                      placeholder="https://suaempresa.com.br/logo.png"
                      value={companyLogoUrl}
                      onChange={(e) => setCompanyLogoUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none text-xs"
                    />
                  )}
                </>
              )}
            </div>

            {/* Canais e Redes Sociais da Empresa (Exibidos na Página Completa da Vaga) */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Canais e Redes da Empresa (Opcional - Exibidos na Página da Vaga)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Site Oficial da Empresa
                  </label>
                  <input
                    type="url"
                    placeholder="https://suaempresa.com.br"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Instagram da Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="@suaempresa ou link"
                    value={companyInstagram}
                    onChange={(e) => setCompanyInstagram(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    LinkedIn da Empresa
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/..."
                    value={companyLinkedin}
                    onChange={(e) => setCompanyLinkedin(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Sobre a Empresa / Histórico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Empresa potiguar fundada em 2015, referência no varejo no RN."
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Linha 2: Cidade, Bairro e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Cidade (RN) *
                </label>
                <select 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Natal">Natal</option>
                  <option value="Parnamirim">Parnamirim</option>
                  <option value="Mossoró">Mossoró</option>
                  <option value="São Gonçalo do Amarante">São Gonçalo do Amarante</option>
                  <option value="Macaíba">Macaíba</option>
                  <option value="Ceará-Mirim">Ceará-Mirim</option>
                  <option value="Caicó">Caicó</option>
                  <option value="Currais Novos">Currais Novos</option>
                  <option value="Assú">Assú</option>
                  <option value="Extremoz">Extremoz</option>
                  <option value="Nísia Floresta">Nísia Floresta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Bairro
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Alecrim, Ponta Negra..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Área / Categoria
                </label>
                <select 
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Modalidade *
                </label>
                <select 
                  value={workModel}
                  onChange={(e) => setWorkModel(e.target.value as WorkModel)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="HIBRIDO">Híbrido</option>
                  <option value="REMOTO">Remoto (Home Office)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tipo de Contrato *
                </label>
                <select 
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as ContractType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all cursor-pointer"
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Remuneração
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
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
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Valor Mínimo (R$)</label>
                    <input 
                      type="number"
                      placeholder="1518"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Valor Máximo (R$ opcional)</label>
                    <input 
                      type="number"
                      placeholder="2000"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Linha 5: Descrição da Vaga */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Descrição das Atividades *
              </label>
              <textarea 
                required
                rows={3}
                placeholder="Descreva o dia a dia da função e as principais atribuições..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all"
              />
            </div>

            {/* Linha 6: Requisitos e Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Requisitos & Qualificações
                </label>
                <textarea 
                  rows={2}
                  placeholder="• Ensino médio completo&#10;• Experiência com público"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Benefícios Oferecidos
                </label>
                <textarea 
                  rows={2}
                  placeholder="• Vale Transporte&#10;• Vale Alimentação"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:outline-none transition-all text-xs"
                />
              </div>
            </div>

            {/* Linha 7: Como se Candidatar (Contato do RH) - Anexo 01 com suporte total a Dark Mode */}
            <div className="p-4 bg-brand-50/60 dark:bg-slate-800/90 rounded-2xl border border-brand-100 dark:border-slate-700 space-y-3 transition-colors">
              <span className="block text-xs font-bold text-brand-800 dark:text-brand-400 uppercase">
                Onde o candidato deve enviar o currículo? *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-300 mb-1">Canal de Envio</label>
                  <select 
                    value={applicationChannel}
                    onChange={(e) => setApplicationChannel(e.target.value as ApplicationChannel)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="EMAIL">E-mail de RH</option>
                    <option value="WHATSAPP">WhatsApp do RH</option>
                    <option value="LINK">Link / Site de Vagas</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                    {applicationChannel === 'EMAIL' ? 'E-mail para receber currículos' : applicationChannel === 'WHATSAPP' ? 'Número WhatsApp com DDD (ex: 84988887777)' : 'URL do formulário'}
                  </label>
                  <input 
                    type={applicationChannel === 'EMAIL' ? 'email' : 'text'}
                    required
                    placeholder={applicationChannel === 'EMAIL' ? 'curriculos@suaempresa.com.br' : applicationChannel === 'WHATSAPP' ? '84988887777' : 'https://empresa.gupy.io'}
                    value={applicationTarget}
                    onChange={(e) => setApplicationTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* REQUISITO 2: Escolha do Tipo de Anúncio / 30 Dias em Destaque VIP com Ativação Automática */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Escolha o Plano de Divulgação da Vaga
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                  Ativação Segura & Transparente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Opção Gratuita */}
                <label className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  !isFeatured 
                    ? 'bg-white dark:bg-slate-800 border-brand-500 ring-2 ring-brand-500/20 shadow-xs' 
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                      <span className="font-bold text-xs text-slate-800 dark:text-white">Anúncio Padrão</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Grátis</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Publicação no catálogo oficial com busca e filtros por cidade e cargo.</p>
                </label>

                {/* Opção Destaque VIP (30 DIAS NO TOPO) */}
                <label className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all relative ${
                  isFeatured 
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/50 ring-2 ring-amber-400/20 shadow-xs' 
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={isFeatured} 
                        onChange={() => setIsFeatured(false)}
                        disabled
                        className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          Destaque VIP (disponível em breve)
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 bg-amber-200/90 dark:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">R$ 29,90</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">
                    A contratação do destaque será liberada após a integração bancária.
                  </p>
                </label>
              </div>

              {/* Box de Ativação Automática via Pix Único */}
              {isFeatured && (
                <div className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-amber-300 dark:border-amber-500/40 shadow-xs space-y-4 mt-3 animate-in fade-in transition-colors">
                  
                  {isVipApproved ? (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                          Pagamento Confirmado! Destaque VIP Ativado por 30 Dias!
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Sua vaga será publicada automaticamente com selo dourado e fixação prioritária no topo.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Ativação Automática do Destaque VIP (R$ 29,90)
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Válido por 30 dias
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 flex items-center justify-center">
                          {uniqueEmvCode ? (
                            <QRCodeSVG 
                              value={uniqueEmvCode} 
                              size={120} 
                              level="M" 
                              className="w-28 h-28"
                            />
                          ) : (
                            <div className="w-28 h-28 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            QR Code exclusivo para este anúncio. O sistema identifica o pagamento e ativa o Destaque VIP <strong>automaticamente em tempo real</strong>:
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (uniqueEmvCode) {
                                  navigator.clipboard.writeText(uniqueEmvCode);
                                  setCopiedPix(true);
                                  setTimeout(() => setCopiedPix(false), 3000);
                                }
                              }}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              {copiedPix ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copia e Cola Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar Código Pix (R$ 29,90)</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleCheckPixManual}
                              disabled={isCheckingPix}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                            >
                              {isCheckingPix ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                  <span>Verificando...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Já Paguei (Verificar)</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={generateNewPixCharge}
                              title="Gerar novo QR Code exclusivo"
                              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 gap-1">
                            <span>Chave: <strong>pix@natalvagas.com.br</strong></span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">ID: {uniqueTxid}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notificação de Status de Verificação (Sem aprovação falsa) */}
                      {pixStatusNotice && (
                        <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 animate-in fade-in ${
                          pixStatusNotice.type === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : pixStatusNotice.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-red-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}>
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{pixStatusNotice.message}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 transition-colors">
              <button 
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isFeatured ? 'Publicar Vaga com Destaque VIP (30 Dias)' : 'Publicar Vaga Imediatamente'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Área da Empresa"
        subtitle="Acesse ou crie a conta da sua empresa gratuitamente para anunciar vagas."
      />
    </div>
  );
};
