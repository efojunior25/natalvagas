import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const JobSafety: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Dicas de Segurança e Combate a Golpes — Natal Vagas';
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-3 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Proteção ao Trabalhador Potiguar
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dicas de Segurança: Como Identificar e Evitar Golpes de Emprego
            </h1>
            <p className="text-slate-500 mt-2">
              Orientações essenciais para proteger seu tempo, dinheiro e dados pessoais durante a busca por trabalho.
            </p>
          </header>

          <section className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
            <p className="font-extrabold text-base sm:text-lg flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              Regra de Ouro: Processo seletivo sério NUNCA cobra nada!
            </p>
            <p className="text-sm leading-relaxed">
              O Natal Vagas é 100% gratuito. Jamais aceite pagar por cursos obrigatórios, uniformes adiantados, exames admissionais antes da contratação, taxas de envio de currículo ou certificados prévios.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <h2 className="font-bold text-rose-900 text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                Sinais Claros de Golpe
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-rose-950">
                <li>• Pedido de pagamento via PIX para "liberar a vaga" ou "agendar entrevista".</li>
                <li>• Exigência de compra de um curso específico como pré-requisito para contratação imediata.</li>
                <li>• Promessas de salários irreais para funções simples (ex: R$ 8.000 para digitador sem experiência).</li>
                <li>• Mensagens de recrutadores via WhatsApp usando números internacionais (+1, +62, etc.) ou sem perfil comercial.</li>
                <li>• Pedido de envio de fotos de documentos pessoais antes de qualquer etapa seletiva oficial.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <h2 className="font-bold text-emerald-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Boas Práticas de Segurança
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-emerald-950">
                <li>• Candidate-se através dos links oficiais (Gupy, Pandapé, sites das empresas) disponibilizados no Natal Vagas.</li>
                <li>• Pesquise a empresa no Google, LinkedIn e Reclame Aqui para confirmar sua existência física no RN.</li>
                <li>• Jamais compartilhe senhas, dados de cartão de crédito ou códigos de SMS recebidos no celular.</li>
                <li>• Desconfie de mensagens que pressionam por decisões imediatas com ameaça de "perder a vaga hoje".</li>
              </ul>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-500" />
              Suspeitou de Algum Anúncio?
            </h2>
            <p>
              Caso veja qualquer oportunidade suspeita divulgada no estado ou vinculada indevidamente ao nome do Natal Vagas, avise nossa equipe pelo e-mail <a href="mailto:contato@natalvagas.com.br" className="text-brand-600 underline font-semibold">contato@natalvagas.com.br</a> ou através da nossa <Link to="/contato" className="text-brand-600 underline">página de contato</Link>. Agiremos prontamente para proteger nossa comunidade.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};
