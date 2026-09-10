import React, { useEffect } from 'react';
import { Target, Users, CheckCircle, ArrowLeft, Heart, Sparkles, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const AboutUs: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Quem Somos — Natal Vagas | O Portal de Empregos do RN';
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
              <Sparkles className="w-3.5 h-3.5" />
              Nossa História & Missão
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Sobre o Natal Vagas
            </h1>
            <p className="text-slate-500 mt-2">
              Conectando os talentos do Rio Grande do Norte às melhores empresas da região.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              O Que é o Natal Vagas?
            </h2>
            <p>
              O <strong>Natal Vagas</strong> nasceu da necessidade de simplificar e democratizar o acesso a vagas de emprego reais e verificadas em Natal, na Grande Natal e em todo o estado do Rio Grande do Norte.
            </p>
            <p>
              Sabemos o quanto o processo de busca por emprego pode ser exaustivo, especialmente com a proliferação de anúncios desatualizados, vagas falsas ou intermediários que cobram por cadastros. Nossa missão é ser o <strong>ponto de encontro confiável e gratuito</strong> entre profissionais que buscam uma colocação no mercado e empresas que precisam contratar talentos potiguares.
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Foco Regional</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Oportunidades em Natal, Mossoró, Parnamirim, Macaíba, São Gonçalo do Amarante, Caicó e outras cidades potiguares.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Fontes Verificadas</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Todas as vagas vêm com link oficial da empresa (Gupy, Pandapé, portais de carreira) para candidatura direta sem pegadinhas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">100% Gratuito</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Gratuito tanto para o candidato pesquisar e se candidatar quanto para empresas cadastrarem seus anúncios.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Nosso Processo Editorial e Curadoria
            </h2>
            <p>
              Nossa equipe monitora diariamente os principais canais oficiais de grandes e médias empresas no RN. Antes de um anúncio entrar no portal, checamos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>A idoneidade da empresa contratante e a existência real da oportunidade.</li>
              <li>A vigência do prazo de inscrição para não exibir anúncios expirados.</li>
              <li>O direcionamento seguro para a página de inscrição oficial da empresa.</li>
            </ul>
          </section>

          <section className="p-5 rounded-2xl bg-brand-50 border border-brand-100 text-brand-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-brand-800">
              <MapPin className="w-5 h-5 text-brand-600" />
              Sede e Atuação
            </div>
            <p className="text-sm text-brand-900">
              Estamos situados em Natal/RN. Caso queira conversar com nossa equipe, anunciar uma vaga ou sugerir melhorias, fale conosco pelo e-mail <a href="mailto:contato@natalvagas.com.br" className="font-semibold underline">contato@natalvagas.com.br</a>.
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};
