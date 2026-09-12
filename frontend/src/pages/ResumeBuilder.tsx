import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Download, Sparkles, Plus, Trash2, 
  ArrowLeft, Crown, Eye, Edit3, MessageCircle, 
  Briefcase, GraduationCap, User, Wrench
} from 'lucide-react';
import { ProPaymentModal } from '../components/ProPaymentModal';
import { AuthModal } from '../components/AuthModal';
import { ResumeLaunchOfferModal } from '../components/ResumeLaunchOfferModal';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PostJobModal } from '../components/PostJobModal';
import { useAuth, PRO_TOKEN_KEY, verifyProToken } from '../context/AuthContext';

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  course: string;
  year: string;
}

interface ResumeData {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  additionalInfo: string;
}

const INITIAL_DATA: ResumeData = {
  fullName: 'Francisco Silva',
  targetRole: 'Auxiliar Administrativo / Atendimento',
  email: 'francisco.silva@email.com',
  phone: '(84) 99876-5432',
  city: 'Natal - RN',
  neighborhood: 'Lagoa Nova',
  summary: 'Profissional dedicado com sólida experiência em atendimento ao cliente, rotinas de escritório e controle de planilhas. Focado em organização, pontualidade e resolução ágil de demandas.',
  experiences: [
    {
      id: '1',
      company: 'Comércio Potiguar Ltda',
      role: 'Atendente de Loja',
      period: 'Jan/2023 - Atualmente',
      description: 'Atendimento direto ao cliente, emissão de notas fiscais, controle de estoque e organização do salão de vendas.'
    },
    {
      id: '2',
      company: 'Distribuidora Natal',
      role: 'Auxiliar de Estoque',
      period: 'Mar/2021 - Dez/2022',
      description: 'Conferência de mercadorias, organização de almoxarifado e suporte à logística de entregas na Grande Natal.'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Escola Estadual Winston Churchill',
      course: 'Ensino Médio Completo',
      year: 'Concluído em 2020'
    },
    {
      id: '2',
      institution: 'SENAC RN',
      course: 'Curso de Excel & Rotinas Administrativas (60h)',
      year: 'Concluído em 2022'
    }
  ],
  skills: ['Atendimento ao Cliente', 'Pacote Office (Word e Excel)', 'Organização e Pontualidade', 'Comunicação Assertiva', 'Trabalho em Equipe'],
  additionalInfo: 'Disponibilidade total de horários para escala comercial. CNH categoria B.'
};

const SUGGESTED_OBJECTIVES: { [key: string]: string } = {
  'Administrativo': 'Atuar na área administrativa prestando suporte em rotinas de escritório, controle de documentos e planilhas, com compromisso e atenção aos detalhes.',
  'Comércio e Vendas': 'Busco oportunidade no setor comercial/vendas para aplicar habilidades de negociação, atendimento de excelência e foco em metas de faturamento.',
  'Atendimento e Recepção': 'Oferecer um atendimento cordial, ágil e resolutivo aos clientes e visitantes, zelando pela imagem e organização da recepção.',
  'Logística e Estoque': 'Contribuir no recebimento, estocagem, inventário e expedição de produtos, com agilidade e foco na preservação das mercadorias.',
  'Primeiro Emprego / Jovem': 'Em busca da primeira oportunidade profissional para aplicar minha dedicação, facilidade de aprendizado e vontade de crescer junto à empresa.'
};

const QUICK_SKILLS = [
  'Atendimento ao Cliente', 'Pacote Office', 'Excel Avançado', 'Vendas e Negociação', 
  'Organização', 'Comunicação', 'Pontualidade', 'Controle de Caixa', 'Trabalho em Equipe', 'Proatividade'
];

type TemplateType = 'ats' | 'modern' | 'executive' | 'minimal';

export const ResumeBuilder: React.FC = () => {
  const [data, setData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('natalvagas_resume_draft');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('ats');
  const { user } = useAuth();
  const [isPro, setIsPro] = useState<boolean>(() => {
    return verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
  });
  const effectiveIsPro = isPro || !!user?.isPro;

  useEffect(() => {
    if (user?.isPro) {
      setIsPro(true);
    }
  }, [user?.isPro]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isLaunchOfferOpen, setIsLaunchOfferOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [newSkill, setNewSkill] = useState<string>('');

  // Salva rascunho automaticamente
  useEffect(() => {
    localStorage.setItem('natalvagas_resume_draft', JSON.stringify(data));
  }, [data]);

  // Atualiza SEO da página
  useEffect(() => {
    document.title = 'Criar Currículo Grátis e Profissional | Natal Vagas';
  }, []);

  // Exibe o Pop-up Social de Oferta de Lançamento após 3 segundos
  useEffect(() => {
    if (!effectiveIsPro) {
      const shown = sessionStorage.getItem('natalvagas_launch_offer_shown');
      if (!shown) {
        const timer = setTimeout(() => {
          setIsLaunchOfferOpen(true);
          sessionStorage.setItem('natalvagas_launch_offer_shown', 'true');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [effectiveIsPro]);

  const handleSelectTemplate = (template: TemplateType) => {
    if (template !== 'ats' && !effectiveIsPro) {
      setIsPaymentModalOpen(true);
      return;
    }
    setActiveTemplate(template);
  };

  const handlePrint = () => {
    if (activeTemplate !== 'ats' && !effectiveIsPro) {
      setIsPaymentModalOpen(true);
      return;
    }
    window.print();
  };

  // Funções de atualização
  const updateData = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      period: '',
      description: ''
    };
    setData(prev => ({ ...prev, experiences: [...prev.experiences, newExp] }));
  };

  const removeExperience = (id: string) => {
    setData(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== id) }));
  };

  const updateExperience = (id: string, field: keyof Experience, val: string) => {
    setData(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: val } : e)
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      course: '',
      year: ''
    };
    setData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const removeEducation = (id: string) => {
    setData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  const updateEducation = (id: string, field: keyof Education, val: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: val } : e)
    }));
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !data.skills.includes(trimmed)) {
      setData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      
      {/* Barra de Navegação Principal do Site (Oculta na impressão) */}
      <div className="print:hidden">
        <Navbar onOpenPostJob={() => setIsPostJobOpen(true)} />
      </div>

      {/* Sub-barra de Status do Currículo */}
      <div className="print:hidden bg-white/85 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-brand-600 flex items-center gap-1 transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              Criar Currículo Profissional
            </span>
          </div>

          <div className="flex items-center gap-3">
            {effectiveIsPro ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-extrabold shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Acesso PRO Ativo</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Oferta PRO (R$ 9,90)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seletor de Abas Mobile (Formulário vs Prévia) */}
      <div className="print:hidden lg:hidden flex border-b border-slate-200 bg-white sticky top-16 sm:top-20 z-20">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-3 text-center text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
            mobileTab === 'form' 
              ? 'border-brand-600 text-brand-600 bg-brand-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Preencher Dados</span>
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-3 text-center text-xs font-bold flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
            mobileTab === 'preview' 
              ? 'border-brand-600 text-brand-600 bg-brand-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Ver Prévia do PDF</span>
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA 1: FORMULÁRIO DE EDIÇÃO (Oculto em telas menores se a aba for 'preview') */}
          <div className={`print:hidden lg:col-span-6 space-y-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Escolha do Modelo */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                1. Escolha o Modelo de Currículo
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                {/* Modelo ATS Grátis */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('ats')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    activeTemplate === 'ats' 
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">ATS Clássico</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm w-fit mt-1">
                    Grátis
                  </span>
                </button>

                {/* Modelo Moderno Pro */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('modern')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    activeTemplate === 'modern' 
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">Moderno</span>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm w-fit mt-1 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> Pro
                  </span>
                </button>

                {/* Modelo Executivo Pro */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('executive')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    activeTemplate === 'executive' 
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">Executivo</span>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm w-fit mt-1 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> Pro
                  </span>
                </button>

                {/* Modelo Minimalista Pro */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('minimal')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    activeTemplate === 'minimal' 
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">Minimal</span>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm w-fit mt-1 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> Pro
                  </span>
                </button>
              </div>

              {/* Status ou Atalho de Ativação do Código PRO */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {effectiveIsPro ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acesso PRO Ativo: Todos os 4 modelos liberados</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="text-brand-600 hover:text-brand-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Já tem um código de ativação PRO? Clique aqui para validar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-brand-600" />
                <span>Dados de Contato</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={data.fullName}
                    onChange={(e) => updateData('fullName', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cargo Desejado</label>
                  <input
                    type="text"
                    value={data.targetRole}
                    onChange={(e) => updateData('targetRole', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                    placeholder="Ex: Atendente de Loja"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => updateData('phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                    placeholder="(84) 9..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                    placeholder="seuemail@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cidade - UF</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => updateData('city', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                    placeholder="Natal - RN"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={data.neighborhood}
                    onChange={(e) => updateData('neighborhood', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                    placeholder="Alecrim / Ponta Negra..."
                  />
                </div>
              </div>
            </div>

            {/* Resumo Profissional com Sugestões */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Resumo Otimizado por IA (Padrão ATS)</span>
                </h2>
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                  Palavras-chave de RH
                </span>
              </div>

              <textarea
                rows={4}
                value={data.summary}
                onChange={(e) => updateData('summary', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-hidden"
                placeholder="Breve descrição dos seus pontos fortes e objetivo profissional..."
              />

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-2">
                  Modelos de Perfil Profissional Otimizados para Natal/RN:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(SUGGESTED_OBJECTIVES).map(([category, text]) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => updateData('summary', text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      + {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Experiências Profissionais */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  <span>Experiências Profissionais</span>
                </h2>
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Vaga</span>
                </button>
              </div>

              <div className="space-y-4">
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remover experiência"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Empresa</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          placeholder="Nome da empresa"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cargo</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          placeholder="Cargo desempenhado"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Período</label>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={(e) => updateExperience(exp.id, 'period', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="Ex: Jan/2022 - Mar/2023 ou Atualmente"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Principais Atividades</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="Descreva o que fazia no dia a dia..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formação e Cursos */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-brand-600" />
                  <span>Escolaridade & Cursos</span>
                </h2>
                <button
                  type="button"
                  onClick={addEducation}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                      <input
                        type="text"
                        value={edu.course}
                        onChange={(e) => updateEducation(edu.id, 'course', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="Curso / Grau de escolaridade"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        placeholder="Instituição / Escola"
                      />
                    </div>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      placeholder="Ex: Concluído em 2023 ou Cursando"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Habilidades */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-brand-600" />
                <span>Habilidades & Competências</span>
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200"
                  placeholder="Digite uma competência e tecle Enter..."
                />
                <button
                  type="button"
                  onClick={() => addSkill(newSkill)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Tags selecionadas */}
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium border border-brand-200/60"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-rose-600 text-brand-400"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Sugestões frequentes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SKILLS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addSkill(item)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] transition-colors cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <h2 className="font-bold text-slate-900 text-sm">Informações Adicionais (Opcional)</h2>
              <textarea
                rows={2}
                value={data.additionalInfo}
                onChange={(e) => updateData('additionalInfo', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                placeholder="Ex: CNH B, disponibilidade para viagens ou trabalho aos sábados..."
              />
            </div>

            {/* Banner de Upsell VIP (Revisão Humana via WhatsApp) */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Consultoria VIP de RH</span>
              </div>
              <h3 className="text-lg font-black leading-snug">
                Quer que um recrutador parceiro revise e otimize seu currículo?
              </h3>
              <p className="text-xs text-emerald-100 mt-2 leading-relaxed">
                Ajustamos as palavras-chave certas para passar na triagem das melhores empresas de Natal e Parnamirim.
              </p>
              <a
                href="https://wa.me/5584992344922?text=Ol%C3%A1%2C+gostaria+da+revis%C3%A3o+humana+do+meu+curr%C3%ADculo+pelo+Natal+Vagas"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Solicitar Revisão por R$ 29,90</span>
              </a>
            </div>

          </div>

          {/* COLUNA 2: PRÉVIA AO VIVO / ÁREA DE IMPRESSÃO (Folha A4) */}
          <div className={`lg:col-span-6 sticky top-24 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-brand-600" /> Prévia do Currículo (A4)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Formato padrão A4 pronto para envio e impressão
                </span>
              </div>

              {/* Botão Baixar PDF Próximo ao Documento */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-500/25 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Currículo em PDF</span>
              </button>
            </div>

            {/* FOLHA DO CURRÍCULO (ESTILIZADA PARA TELA E IMPRESSÃO) */}
            <div 
              id="resume-sheet"
              className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-h-[750px] p-8 sm:p-12 text-slate-800 transition-all print:p-0 print:border-none print:shadow-none print:m-0 print:w-full"
            >
              
              {/* ==================================================== */}
              {/* MODELO 1: ATS CLÁSSICO (Padrão Grátis) */}
              {/* ==================================================== */}
              {activeTemplate === 'ats' && (
                <div className="space-y-6 font-sans">
                  {/* Cabeçalho */}
                  <div className="border-b-2 border-slate-900 pb-4 text-center">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
                      {data.fullName || 'Seu Nome Completo'}
                    </h1>
                    <p className="text-sm sm:text-base font-bold text-slate-700 mt-1">
                      {data.targetRole || 'Cargo Desejado'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                      {data.city && <span>{data.neighborhood ? `${data.neighborhood}, ` : ''}{data.city}</span>}
                      {data.phone && <span>• {data.phone}</span>}
                      {data.email && <span>• {data.email}</span>}
                    </div>
                  </div>

                  {/* Resumo */}
                  {data.summary && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                        Objetivo Profissional
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed text-justify">
                        {data.summary}
                      </p>
                    </div>
                  )}

                  {/* Experiências */}
                  {data.experiences.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                        Experiência Profissional
                      </h3>
                      <div className="space-y-3.5">
                        {data.experiences.map((exp) => (
                          <div key={exp.id} className="text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span></span>
                              <span className="text-[11px] font-normal text-slate-500">{exp.period}</span>
                            </div>
                            {exp.description && (
                              <p className="text-slate-600 mt-1 leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formação */}
                  {data.education.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                        Formação Acadêmica & Cursos
                      </h3>
                      <div className="space-y-2">
                        {data.education.map((edu) => (
                          <div key={edu.id} className="text-xs flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900">{edu.course}</span>
                              <span className="text-slate-600 font-normal"> — {edu.institution}</span>
                            </div>
                            <span className="text-[11px] text-slate-500">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habilidades */}
                  {data.skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                        Principais Competências
                      </h3>
                      <p className="text-xs text-slate-700 font-medium">
                        {data.skills.join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Info Adicional */}
                  {data.additionalInfo && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                        Informações Complementares
                      </h3>
                      <p className="text-xs text-slate-700">
                        {data.additionalInfo}
                      </p>
                    </div>
                  )}

                  {/* Selo Rodapé Gratuito (Viral) */}
                  <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400">
                    <span>Currículo elaborado via <strong>natalvagas.com.br</strong> — O portal oficial de vagas no RN</span>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* MODELO 2: MODERNO POTIGUAR (Pro) */}
              {/* ==================================================== */}
              {activeTemplate === 'modern' && (
                <div className="space-y-6 font-sans">
                  <div className="bg-brand-600 text-white -m-8 sm:-m-12 p-8 sm:p-10 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                      {data.fullName}
                    </h1>
                    <p className="text-sm sm:text-base font-medium text-brand-100 mt-1">
                      {data.targetRole}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-brand-50 mt-4 font-light">
                      <span>{data.neighborhood}, {data.city}</span>
                      <span>{data.phone}</span>
                      <span>{data.email}</span>
                    </div>
                  </div>

                  {data.summary && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 border-b-2 border-brand-600 pb-1 mb-2">
                        Perfil Profissional
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed text-justify">
                        {data.summary}
                      </p>
                    </div>
                  )}

                  {data.experiences.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 border-b-2 border-brand-600 pb-1 mb-3">
                        Trajetória Profissional
                      </h3>
                      <div className="space-y-3.5">
                        {data.experiences.map((exp) => (
                          <div key={exp.id} className="text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{exp.role} <span className="text-brand-600 font-semibold">@ {exp.company}</span></span>
                              <span className="text-[11px] font-medium text-slate-400">{exp.period}</span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.education.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 border-b-2 border-brand-600 pb-1 mb-3">
                        Educação & Certificações
                      </h3>
                      <div className="space-y-2">
                        {data.education.map((edu) => (
                          <div key={edu.id} className="text-xs flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900">{edu.course}</span>
                              <span className="text-slate-600"> • {edu.institution}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-brand-600 border-b-2 border-brand-600 pb-1 mb-2">
                        Habilidades Chave
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {data.skills.map(s => (
                          <span key={s} className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-semibold rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* MODELO 3: EXECUTIVO CORPORATIVO (Pro) */}
              {/* ==================================================== */}
              {activeTemplate === 'executive' && (
                <div className="space-y-6 font-serif">
                  <div className="border-b-4 border-slate-800 pb-4">
                    <h1 className="text-3xl font-black text-slate-900">{data.fullName}</h1>
                    <p className="text-base font-semibold text-slate-600 mt-1 font-sans">{data.targetRole}</p>
                    <p className="text-xs text-slate-500 mt-2 font-sans">
                      {data.neighborhood} • {data.city} • {data.phone} • {data.email}
                    </p>
                  </div>

                  {data.summary && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 font-sans border-b border-slate-200 pb-1 mb-2">
                        Resumo Executivo
                      </h3>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">{data.summary}</p>
                    </div>
                  )}

                  {data.experiences.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 font-sans border-b border-slate-200 pb-1 mb-3">
                        Histórico Profissional
                      </h3>
                      <div className="space-y-3 font-sans">
                        {data.experiences.map((exp) => (
                          <div key={exp.id} className="text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{exp.role}, {exp.company}</span>
                              <span className="text-[11px] text-slate-500 font-normal">{exp.period}</span>
                            </div>
                            <p className="text-slate-600 mt-1">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.education.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 font-sans border-b border-slate-200 pb-1 mb-2">
                        Qualificação Acadêmica
                      </h3>
                      <div className="space-y-1.5 font-sans">
                        {data.education.map((edu) => (
                          <div key={edu.id} className="text-xs flex items-center justify-between">
                            <span><strong>{edu.course}</strong> — {edu.institution}</span>
                            <span className="text-slate-500 text-[11px]">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* MODELO 4: MINIMALISTA COMPACTO (Pro) */}
              {/* ==================================================== */}
              {activeTemplate === 'minimal' && (
                <div className="space-y-5 font-sans text-xs">
                  <div>
                    <h1 className="text-2xl font-light tracking-wide text-slate-900">{data.fullName}</h1>
                    <div className="flex items-center gap-3 text-slate-500 mt-1 text-[11px]">
                      <span>{data.targetRole}</span>
                      <span>/</span>
                      <span>{data.city}</span>
                      <span>/</span>
                      <span>{data.phone}</span>
                    </div>
                  </div>

                  {data.summary && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-slate-600 leading-relaxed">{data.summary}</p>
                    </div>
                  )}

                  {data.experiences.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">Experiência</span>
                      <div className="space-y-3">
                        {data.experiences.map((exp) => (
                          <div key={exp.id}>
                            <div className="flex justify-between font-medium text-slate-800">
                              <span>{exp.role} — {exp.company}</span>
                              <span className="text-slate-400 text-[10px]">{exp.period}</span>
                            </div>
                            <p className="text-slate-500 mt-0.5">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.education.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">Formação</span>
                      {data.education.map((edu) => (
                        <div key={edu.id} className="flex justify-between text-slate-700 mb-1">
                          <span>{edu.course} ({edu.institution})</span>
                          <span className="text-slate-400 text-[10px]">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Modal de Pagamento Pix R$ 9,90 */}
      <ProPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => setIsPro(true)}
      />

      {/* Pop-up Social de Oferta de Lançamento */}
      <ResumeLaunchOfferModal
        isOpen={isLaunchOfferOpen}
        onClose={() => setIsLaunchOfferOpen(false)}
        onSelectPlan={() => setIsPaymentModalOpen(true)}
      />

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Salvar Currículo na Nuvem"
        subtitle="Conecte-se em 1 clique para manter seus dados salvos em qualquer dispositivo."
      />

      {/* Rodapé Institucional (Oculto na impressão) */}
      <div className="print:hidden mt-12">
        <Footer />
      </div>

      {/* Modal de Publicação de Vaga */}
      {isPostJobOpen && (
        <PostJobModal
          isOpen={isPostJobOpen}
          onClose={() => setIsPostJobOpen(false)}
          onJobCreated={() => setIsPostJobOpen(false)}
        />
      )}

    </div>
  );
};

export default ResumeBuilder;
