import React, { useEffect } from 'react';
import { FileCheck, AlertTriangle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const TermsOfUse: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Termos de Uso — Natal Vagas';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg selection:bg-brand-500 selection:text-white">
      <Navbar onOpenPostJob={() => {}} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar para as vagas
        </Link>

        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          <header className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-3 border border-brand-200">
              <FileCheck className="w-3.5 h-3.5" />
              Termos e Condições Gerais
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Termos de Uso
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Última atualização: 10 de setembro de 2026
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              1. Natureza do Serviço e Gratuidade
            </h2>
            <p>
              O <strong>Natal Vagas</strong> é uma plataforma independente de agregação e divulgação de vagas de emprego, estágios e programas de aprendizagem com foco no estado do Rio Grande do Norte. O acesso a todas as oportunidades disponibilizadas no portal é <strong>100% gratuito para os candidatos</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              2. Intermediação e Isenção de Responsabilidade
            </h2>
            <p>
              O Natal Vagas atua exclusivamente como veículo de utilidade pública e divulgação informativa. Não somos responsáveis pela condução das seleções, decisões de contratação, prazos internos das empresas, condições de trabalho ou veracidade de propostas enviadas por terceiros que não passem pela nossa equipe.
            </p>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aviso aos Candidatos:</p>
                <p>Nenhuma empresa séria cobra taxa de inscrição, compra de material, teste psicológico pago ou curso obrigatório para participar de processos seletivos. Caso identifique qualquer conduta suspeita, reporte imediatamente através de nossos canais de contato.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              3. Propriedade Intelectual e Marcas
            </h2>
            <p>
              Os logotipos, marcas comerciais e nomes de empresas exibidos nas vagas pertencem aos seus respectivos titulares de direitos autorais e são utilizados neste portal exclusivamente para fins de identificação da empresa contratante e divulgação da oportunidade de trabalho legítima.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              4. Divulgação por Empresas
            </h2>
            <p>
              Empresas que desejam anunciar vagas devem fornecer informações verídicas, claras e detalhadas sobre a função, localidade e canal de candidatura. É expressamente proibida a publicação de anúncios fraudulentos, esquemas de pirâmide, ofertas enganosas ou com cobrança de qualquer valor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-500" />
              5. Contato e Alterações
            </h2>
            <p>
              Reservamo-nos o direito de atualizar estes Termos periodicamente. Qualquer dúvida pode ser encaminhada para <strong className="text-slate-900">contato@natalvagas.com.br</strong>.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};
