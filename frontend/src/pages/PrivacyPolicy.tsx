import React, { useEffect } from 'react';
import { Shield, Lock, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Política de Privacidade — Natal Vagas';
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200">
              <Shield className="w-3.5 h-3.5" />
              Conformidade com LGPD & Google AdSense
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Política de Privacidade
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Última atualização: 10 de setembro de 2026
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-500" />
              1. Informações Gerais e Compromisso
            </h2>
            <p>
              O portal <strong>Natal Vagas</strong> (acessível em <a href="https://natalvagas.com.br" className="text-brand-600 underline">https://natalvagas.com.br</a>) tem como missão conectar candidatos a oportunidades de emprego reais no Rio Grande do Norte de maneira totalmente gratuita, transparente e segura.
            </p>
            <p>
              Esta Política de Privacidade descreve como tratamos as informações quando você utiliza nosso portal, em total conformidade com a <strong>Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018 - LGPD)</strong> e com os padrões internacionais de privacidade na web.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              2. Cookies e Tecnologias de Terceiros (Google AdSense)
            </h2>
            <p>
              Nosso site utiliza cookies e identificadores anônimos para melhorar a experiência de navegação, analisar métricas de audiência e veicular anúncios relevantes.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm">
              <p className="font-semibold text-slate-800">
                Divulgação de Publicidade de Terceiros (Google AdSense):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  Fornecedores terceirizados, incluindo o <strong>Google</strong>, utilizam cookies para veicular anúncios com base em visitas anteriores dos usuários ao nosso website ou a outros websites na internet.
                </li>
                <li>
                  Com o uso de cookies de publicidade (incluindo o cookie DoubleClick DART), o Google e seus parceiros podem veicular anúncios para os usuários com base nas visitas feitas a este e/ou outros sites na web.
                </li>
                <li>
                  Os usuários podem desativar a publicidade personalizada a qualquer momento acessando as <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline font-medium">Configurações de Anúncios do Google</a>.
                </li>
                <li>
                  Você também pode desativar o uso de cookies de terceiros para publicidade personalizada visitando o site independente <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline font-medium">aboutads.info</a>.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-500" />
              3. Dados Pessoais e Candidaturas
            </h2>
            <p>
              O Natal Vagas <strong>não solicita e não armazena currículos ou dados bancários em seus servidores</strong> para as vagas cadastradas. As candidaturas são realizadas diretamente:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Nas plataformas oficiais de recrutamento das próprias empresas (como Gupy, Pandapé/InfoJobs, LG Lugar de Gente, portais de carreiras).</li>
              <li>Através de canais oficiais abertos indicados pelas empresas contratantes (como e-mail corporativo ou WhatsApp comercial).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              4. Seus Direitos sob a LGPD
            </h2>
            <p>
              Nos termos da LGPD, você tem direito a confirmar a existência de tratamento de dados, solicitar correção, anonimização, bloqueio ou eliminação de informações eventualmente fornecidas em formulários de contato ou anúncio de vaga.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              5. Contato do Encarregado de Dados (DPO)
            </h2>
            <p>
              Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados neste portal, entre em contato pelo e-mail: <strong className="text-slate-900">privacidade@natalvagas.com.br</strong> ou através da nossa <Link to="/contato" className="text-brand-600 underline">página de contato</Link>.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};
