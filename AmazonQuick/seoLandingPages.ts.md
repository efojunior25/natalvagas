# File: seoLandingPages.ts
- **Original Path:** `frontend/src/data/seoLandingPages.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 152

---

```typescript
import { ContractType, WorkModel } from '../types/job';

export interface SeoLandingConfig {
  slug: string;
  path: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  badge: string;
  introText: string;
  city?: string;
  contractType?: ContractType;
  workModel?: WorkModel;
  onlyNoExperience?: boolean;
}

export const SEO_LANDING_PAGES: SeoLandingConfig[] = [
  {
    slug: 'vagas-natal',
    path: '/vagas-natal',
    h1: 'Vagas de Emprego em Natal / RN',
    metaTitle: 'Vagas de Emprego em Natal / RN — Mais de 1.000 Oportunidades | Natal Vagas',
    metaDescription: 'Encontre mais de 1.000 vagas de emprego abertas em Natal/RN. Vagas no comércio, saúde, tecnologia, turismo e serviços. Candidatura rápida e 100% gratuita.',
    badge: 'Capital & Polo Econômico',
    introText: 'Natal concentra o maior polo comercial, de serviços, saúde e turismo do Rio Grande do Norte. Encontre oportunidades em bairros como Tirol, Petrópolis, Alecrim, Ponta Negra, Lagoa Nova e Candelária.',
    city: 'Natal'
  },
  {
    slug: 'vagas-parnamirim',
    path: '/vagas-parnamirim',
    h1: 'Vagas de Emprego em Parnamirim / RN',
    metaTitle: 'Vagas de Emprego em Parnamirim / RN — Oportunidades Abertas | Natal Vagas',
    metaDescription: 'Confira as vagas de emprego abertas em Parnamirim/RN. Oportunidades no comércio, logística, indústria e serviços na Região Metropolitana.',
    badge: 'Grande Natal & Logística',
    introText: 'Parnamirim é um dos municípios que mais cresce no estado, com forte presença no comércio, logística, construção civil e polos de distribuição na Grande Natal.',
    city: 'Parnamirim'
  },
  {
    slug: 'vagas-mossoro',
    path: '/vagas-mossoro',
    h1: 'Vagas de Emprego em Mossoró / RN',
    metaTitle: 'Vagas de Emprego em Mossoró / RN — Oportunidades no Oeste | Natal Vagas',
    metaDescription: 'Vagas de emprego abertas em Mossoró/RN. Encontre oportunidades no comércio, petróleo e gás, fruticultura, serviços e saúde no Oeste Potiguar.',
    badge: 'Capital do Oeste Potiguar',
    introText: 'Mossoró é a segunda maior cidade do RN e capital econômica do Oeste Potiguar, destacando-se nos setores de comércio, agronegócio, energia, petróleo e serviços.',
    city: 'Mossoró'
  },
  {
    slug: 'vagas-macaiba',
    path: '/vagas-macaiba',
    h1: 'Vagas de Emprego em Macaíba / RN',
    metaTitle: 'Vagas de Emprego em Macaíba / RN — Oportunidades Industriais | Natal Vagas',
    metaDescription: 'Encontre vagas de emprego em Macaíba/RN. Oportunidades nos polos industriais, galpões de distribuição e comércio da Região Metropolitana de Natal.',
    badge: 'Distrito Industrial & Distribuição',
    introText: 'Macaíba abriga importantes distritos industriais e centros de distribuição logística conectados diretamente às principais rodovias do Rio Grande do Norte.',
    city: 'Macaíba'
  },
  {
    slug: 'vagas-sao-goncalo',
    path: '/vagas-sao-goncalo',
    h1: 'Vagas de Emprego em São Gonçalo do Amarante / RN',
    metaTitle: 'Vagas de Emprego em São Gonçalo do Amarante / RN | Natal Vagas',
    metaDescription: 'Confira oportunidades de trabalho em São Gonçalo do Amarante/RN. Vagas no aeroporto internacional, logística e comércio regional.',
    badge: 'Polo Aeroportuário & Logística',
    introText: 'Com a presença do Aeroporto Internacional Aluízio Alves, São Gonçalo do Amarante se consolidou como ponto estratégico de transporte, logística e serviços.',
    city: 'São Gonçalo do Amarante'
  },
  {
    slug: 'vagas-caico',
    path: '/vagas-caico',
    h1: 'Vagas de Emprego em Caicó / RN',
    metaTitle: 'Vagas de Emprego em Caicó / RN — Polo do Seridó | Natal Vagas',
    metaDescription: 'Oportunidades de emprego abertas em Caicó e região do Seridó potiguar. Vagas em confecção, laticínios, comércio e serviços.',
    badge: 'Coração do Seridó',
    introText: 'Caicó é a principal referência econômica e cultural da região do Seridó, com forte mercado no comércio varejista, polo têxtil, alimentício e serviços.',
    city: 'Caicó'
  },
  {
    slug: 'vagas-currais-novos',
    path: '/vagas-currais-novos',
    h1: 'Vagas de Emprego em Currais Novos / RN',
    metaTitle: 'Vagas de Emprego em Currais Novos / RN | Natal Vagas',
    metaDescription: 'Confira vagas de trabalho abertas em Currais Novos/RN. Oportunidades em mineração, comércio, educação e serviços no Seridó Oriental.',
    badge: 'Seridó Oriental',
    introText: 'Currais Novos se destaca pelo comércio dinâmico, setor de mineração, energia renovável e polo educacional no interior do estado.',
    city: 'Currais Novos'
  },
  {
    slug: 'vagas-ceara-mirim',
    path: '/vagas-ceara-mirim',
    h1: 'Vagas de Emprego em Ceará-Mirim / RN',
    metaTitle: 'Vagas de Emprego em Ceará-Mirim / RN | Natal Vagas',
    metaDescription: 'Vagas de emprego abertas em Ceará-Mirim/RN. Oportunidades no setor agropecuário, comércio local e Região Metropolitana de Natal.',
    badge: 'Vale do Ceará-Mirim',
    introText: 'Ceará-Mirim alia vocação agrícola e industrial ao crescimento comercial e de serviços na zona norte da Grande Natal.',
    city: 'Ceará-Mirim'
  },
  {
    slug: 'vagas-assu',
    path: '/vagas-assu',
    h1: 'Vagas de Emprego em Assú (Açu) / RN',
    metaTitle: 'Vagas de Emprego em Assú / RN — Polo do Vale do Açu | Natal Vagas',
    metaDescription: 'Oportunidades de trabalho em Assú/RN. Vagas em agronegócio, fruticultura irrigada, comércio e energia no Vale do Açu.',
    badge: 'Vale do Açu & Agronegócio',
    introText: 'O município de Assú é polo de fruticultura irrigada, geração de energia e comércio estratégico no Vale do Açu.',
    city: 'Assú'
  },
  {
    slug: 'vagas-sem-experiencia',
    path: '/vagas-sem-experiencia',
    h1: 'Vagas Sem Experiência e 1º Emprego no RN',
    metaTitle: 'Vagas Sem Experiência e Primeiro Emprego no RN | Natal Vagas',
    metaDescription: 'Encontre vagas de emprego que não exigem experiência prévia em Natal, Parnamirim, Mossoró e no RN. Oportunidades para iniciar no mercado de trabalho.',
    badge: '🌱 Porta de Entrada no Mercado',
    introText: 'Seleção especial de oportunidades para quem busca ingressar no mercado de trabalho ou iniciar em uma nova área, com vagas de jovem aprendiz, estágio e cargos operacionais que não exigem experiência.',
    onlyNoExperience: true
  },
  {
    slug: 'vagas-estagio-rn',
    path: '/vagas-estagio-rn',
    h1: 'Vagas de Estágio no Rio Grande do Norte',
    metaTitle: 'Vagas de Estágio em Natal e no RN — Oportunidades para Estudantes | Natal Vagas',
    metaDescription: 'Vagas de estágio remunerado em Natal, Parnamirim, Mossoró e todo o RN. Oportunidades para nível médio, técnico e superior.',
    badge: '🎓 Estudantes Médio / Técnico / Superior',
    introText: 'Programas de estágio com bolsa-auxílio remunerada e benefícios para estudantes em Natal e no interior do RN desenvolverem suas carreiras.',
    contractType: 'ESTAGIO'
  },
  {
    slug: 'vagas-jovem-aprendiz-rn',
    path: '/vagas-jovem-aprendiz-rn',
    h1: 'Vagas de Jovem Aprendiz no RN',
    metaTitle: 'Vagas de Jovem Aprendiz em Natal e no RN | Natal Vagas',
    metaDescription: 'Oportunidades do programa Jovem Aprendiz (Lei da Aprendizagem) no Rio Grande do Norte. Vagas para jovens de 14 a 24 anos com capacitação profissional.',
    badge: '🌟 Programa Jovem Aprendiz (14 a 24 anos)',
    introText: 'Vagas com carteira assinada, cursos de capacitação técnica profissional e jornada compatível com os estudos conforme a Lei da Aprendizagem.',
    contractType: 'JOVEM_APRENDIZ'
  },
  {
    slug: 'vagas-home-office-rn',
    path: '/vagas-home-office-rn',
    h1: 'Vagas Home Office e Trabalho Remoto no RN',
    metaTitle: 'Vagas Home Office e Trabalho Remoto no RN | Natal Vagas',
    metaDescription: 'Vagas de emprego home office e modelo remoto abertas para profissionais no Rio Grande do Norte. Trabalhe de qualquer lugar do estado.',
    badge: '🏠 100% Remoto & Home Office',
    introText: 'Oportunidades para trabalhar de casa com flexibilidade para empresas do RN, nacionais e multinacionais contratando profissionais potiguares.',
    workModel: 'REMOTO'
  }
];

export const SEO_LANDING_MAP = new Map<string, SeoLandingConfig>(
  SEO_LANDING_PAGES.map(page => [page.slug, page])
);

```
