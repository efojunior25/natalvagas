# File: FaqSection.tsx
- **Original Path:** `frontend/src/components/FaqSection.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 107

---

```tsx
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Como me candidatar às vagas de emprego em Natal e no RN divulgadas no site?',
    answer: 'Para se candidatar, basta clicar sobre a vaga desejada para abrir os detalhes completos. Em seguida, clique no botão "Candidatar-se no site da empresa" para ser redirecionado com segurança à página oficial de seleção (Gupy, Pandapé/InfoJobs ou portal corporativo da empresa). Não cobramos nenhuma taxa e não exigimos cadastros intermediários.',
  },
  {
    question: 'O Natal Vagas cobra alguma taxa de inscrição ou cobrança por currículo?',
    answer: 'Não. O Natal Vagas é 100% gratuito para todos os trabalhadores e estudantes. Alertamos sempre que processos seletivos idôneos NUNCA cobram por inscrição, uniformes, certificados prévios ou compra de cursos obrigatórios.',
  },
  {
    question: 'Quais cidades do Rio Grande do Norte contam com vagas no portal?',
    answer: 'Divulgamos vagas em Natal (incluindo bairros como Tirol, Ponta Negra, Candelária, Alecrim e Petrópolis), Mossoró, Parnamirim, Macaíba, São Gonçalo do Amarante, Currais Novos, Caicó, Açu, Ceará-Mirim, São José de Mipibu e Santo Antônio, além de oportunidades em formato híbrido e remoto para profissionais do RN.',
  },
  {
    question: 'Como encontrar vagas de Estágio e Jovem Aprendiz em Natal?',
    answer: 'Utilize nossa barra de pesquisa digitando "Estágio" ou "Aprendiz", ou selecione o filtro por modalidade. Temos parcerias e acompanhamento contínuo de programas de estágio em empresas como MRV&CO, Baterias Moura, FTD Educação, além de vagas no comércio e indústria farmacêutica.',
  },
  {
    question: 'Sou empresário ou recrutador. Como posso anunciar uma vaga no Natal Vagas?',
    answer: 'Você pode anunciar gratuitamente clicando no botão "Anunciar Vaga" no topo do site ou através da nossa página de Contato. Nossa equipe revisa as informações e publica a oportunidade para milhares de profissionais de Natal e região.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Schema.org FAQPage para Google Rich Results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="mt-14 pt-10 border-t border-slate-200">
      {/* Script com Schema JSON-LD FAQPage para o Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Dúvidas Frequentes & SEO Potiguar
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Perguntas Frequentes sobre Empregos no RN
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Tire suas dúvidas sobre o mercado de trabalho em Natal, candidatura segura e funcionamento do portal.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-brand-500 shrink-0" />
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

```
