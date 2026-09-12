# PROJECT_CONTEXT.md
> **Original Path in Project:** `PROJECT_CONTEXT.md`

---

# 🧭 Contexto Geral da Aplicação — Natal Vagas

> **Documento Oficial de Arquitetura, Regras de Negócio e Operação**  
> **Versão do Projeto:** 2.0 (Produção Cloudflare Pages + Edge Functions)  
> **Domínio Principal:** [natalvagas.com.br](https://natalvagas.com.br) | **Espelho:** [natalvagas.pages.dev](https://natalvagas.pages.dev)  
> **Repositório GitHub:** `efojunior25/natalvagas` (Branch: `main`)  
> **Última Atualização:** Setembro de 2026

---

## 1. Visão Geral do Produto

O **Natal Vagas** é uma plataforma digital e SaaS desenvolvida para resolver a dor do desemprego e contratação no estado do **Rio Grande do Norte**, com foco na Grande Natal (Natal, Parnamirim, Macaíba, São Gonçalo do Amarante, Extremoz, Ceará-Mirim) e principais polos regionais (Mossoró, Caicó, Currais Novos, Assú, Tibau do Sul/Pipa).

### Proposta de Valor:
- **Para os Candidatos (100% Gratuito):** Acesso rápido, sem necessidade de cadastro burocrático inicial, a mais de **840 vagas reais e verificadas** no RN, com filtros de polos geográficos, modalidade (Presencial, Híbrido, Remoto), filtro dedicado **"🌱 Sem Experiência / 1º Emprego"** e um **Gerador de Currículos Profissionais Padrão ATS**.
- **Para as Empresas e Recrutadores:** Divulgação de vagas simples e gratuita, com opção de upgrade para **Vaga em Destaque VIP** para triplicar o alcance de currículos.
- **Para o Operador (Edson Oliveira):** Um modelo de micro-SaaS enxuto, de altíssimo tráfego orgânico, monetizado via **Google AdSense**, **Planos PRO do Gerador de Currículo (Pix instantâneo Efí Bank)** e **Infoprodutos/Cursos Profissionalizantes Afiliados**.

---

## 2. Arquitetura Técnica & Stack

```mermaid
graph TD
    User([Usuário / Candidato]) -->|HTTPS / DNS Cloudflare| CF[Cloudflare Edge / CDN]
    CF -->|Assets Estáticos| SPA[React 18 + Vite Frontend]
    CF -->|/api/payments/*| Functions[Cloudflare Pages Functions]
    
    subgraph Frontend [Single Page Application]
        SPA --> Router[React Router v6]
        Router --> Home[Página Inicial: Vagas & Filtros]
        Router --> Resume[Gerador de Currículos ATS]
        Router --> Blog[Blog de Notícias & Carreira]
        Router --> Modals[Modais: Detalhes, Checkout, Anúncio]
    end

    subgraph Edge Functions [Backend Serverless]
        Functions --> PixWebhook[/api/payments/pix/webhook]
        Functions --> PixStatus[/api/payments/pix/status/:txid]
        Functions --> VerifyCode[/api/payments/verify-code]
    end

    subgraph External APIs & Services
        PixStatus -.-> EfiBank[Efí Bank API - Cobranças Pix]
        Home -.-> Ads[Google AdSense]
        Modals -.-> Wpp[API Oficial WhatsApp Recrutadores]
    end

    subgraph Data Pipeline
        PythonScripts[scripts/fetch_500_rn_jobs.py] -->|Mineração e Higienização| InitialJobs[frontend/src/data/initialJobs.ts]
        PythonScripts -->|SEO Indexing| Sitemap[frontend/public/sitemap.xml]
    end
```

### Tecnologias Utilizadas:
- **Linguagem Principal:** TypeScript / JavaScript (Node.js 18+).
- **Interface & UI:** React 18, Tailwind CSS v3/v4, Lucide React (ícones vetoriais leves).
- **Bundler & Build Tool:** Vite 5 com code-splitting e minificação Rollup.
- **Hospedagem & Deploy:** Cloudflare Pages com CI/CD conectado ao repositório GitHub.
- **Serverless Backend:** Cloudflare Pages Functions (Edge V8 runtime, pasta `frontend/functions/`).
- **Gateway de Pagamento Pix:** Efí Bank (antiga Gerencianet) via Chave Pix e certificados TLS mútuo (`.p12`).
- **Pipeline de Mineração:** Scripts Python 3 (`BeautifulSoup4`, `requests`) para ingestão de vagas e geração de sitemaps.
- **Backend Legado (Opcional):** Java 17 + Spring Boot 3 + PostgreSQL (`backend/` e `docker-compose.yml`), mantido como alternativa conteinerizada para persistência relacional.

---

## 3. Mapa Detalhado de Diretórios e Arquivos

```
Natal Vagas/
├── .gitignore                      # Proteção de certificados (.p12), node_modules, envs
├── README.md                       # Documentação básica do repositório
├── PROJECT_CONTEXT.md              # Contexto global da aplicação para desenvolvedores e IAs
├── docker-compose.yml              # Setup do banco Postgres + Backend Java (legado)
├── producao-951802-Natal Vagas.p12 # Certificado de Produção Efí Bank (ignorado no Git)
│
├── backend/                        # Backend Spring Boot 3 (API REST legada)
│   ├── pom.xml                     # Dependências Maven (Spring Web, Data JPA, Postgres)
│   └── src/main/java/...           # Entidades Job, Category, controllers e repositories
│
├── scripts/                        # Scripts de automação, mineração e SEO
│   ├── fetch_500_rn_jobs.py        # Crawler de vagas reais no RN (+620 vagas)
│   ├── generate_sitemap.py         # Gerador dinâmico de sitemap.xml (+5.100 URLs)
│   ├── ingest_jobs.py              # Parser e classificador de regimes e cidades
│   ├── rn_job_scraper.py           # Scraper complementar para Natal e Grande Natal
│   └── verify_seo.py               # Validador de tags OpenGraph e Schema.org
│
└── frontend/                       # Aplicação Principal de Produção
    ├── index.html                  # Meta tags SEO, AdSense script e links canônicos
    ├── vite.config.ts              # Configuração Vite e otimização de chunks
    ├── tailwind.config.js          # Paleta de cores da marca (brand-500, surface, etc.)
    │
    ├── functions/                  # Cloudflare Pages Functions (Edge API)
    │   └── api/
    │       └── payments/
    │           ├── verify-code.ts  # Validador de cupons de ativação PRO
    │           └── pix/
    │               ├── webhook.ts  # Webhook receptor de confirmações Pix Efí
    │               └── status/[txid].ts # Polling de status do pagamento Pix
    │
    ├── public/
    │   ├── _redirects              # Regra SPA da Cloudflare (/* /index.html 200)
    │   ├── sitemap.xml             # Sitemap oficial com 840+ vagas e páginas
    │   ├── robots.txt              # Diretrizes para robôs de busca (Googlebot)
    │   ├── ads.txt                 # Validação de publisher Google AdSense
    │   └── assets/                 # Logotipos oficiais e imagens do portal
    │
    └── src/
        ├── main.tsx                # Ponto de entrada React com BrowserRouter
        ├── App.tsx                 # Página Inicial, filtros, paginação e modais
        │
        ├── components/             # Componentes modulares reutilizáveis
        │   ├── Navbar.tsx          # Menu superior responsivo (1280px max-w-7xl)
        │   ├── Footer.tsx          # Rodapé com canais oficiais, links legais e LGPD
        │   ├── HeroBanner.tsx      # Banner principal com busca e seleção de cidades
        │   ├── CityPills.tsx       # Filtro de polos do RN e botão "🌱 Sem Experiência"
        │   ├── JobCard.tsx         # Card de vaga com badges, salários e WhatsApp
        │   ├── JobModal.tsx        # Modal de detalhes com Schema JSON-LD JobPosting
        │   ├── PostJobModal.tsx    # Modal de anúncio de vagas (Grátis vs VIP)
        │   ├── ProPaymentModal.tsx # Checkout Pix Efí Bank e Cartão de Crédito
        │   ├── WhatsAppCommunityBanner.tsx # Seção das comunidades (Em breve)
        │   ├── CourseRecommendations.tsx   # Vitrine de cursos com certificado
        │   ├── FaqSection.tsx      # Perguntas frequentes com Schema FAQPage
        │   ├── AdPlaceholder.tsx   # Espaços publicitários Google AdSense
        │   ├── CookieConsentBanner.tsx # Consentimento LGPD de cookies
        │   ├── AuthModal.tsx       # Login / Cadastro simples de usuários
        │   ├── ResumeLaunchOfferModal.tsx  # Pop-up de oferta relâmpago do PRO
        │   └── SocialPostGeneratorModal.tsx # Gerador de artes/textos para redes
        │
        ├── pages/                  # Páginas roteadas
        │   ├── ResumeBuilder.tsx   # Gerador de Currículos ATS (Folha A4 e PDF)
        │   ├── BlogList.tsx        # Listagem de artigos sobre carreiras no RN
        │   ├── BlogPost.tsx        # Leitor de artigo com leitura e SEO
        │   ├── AboutUs.tsx         # Página institucional "Sobre o Natal Vagas"
        │   ├── Contact.tsx         # Formulário e contatos oficiais de suporte
        │   ├── JobSafety.tsx       # Dicas anti-golpe e segurança do candidato
        │   ├── PrivacyPolicy.tsx   # Política de Privacidade (Conformidade AdSense)
        │   └── TermsOfUse.tsx      # Termos de Uso do Portal
        │
        ├── data/
        │   ├── initialJobs.ts      # Banco local de 843 vagas ativas no RN
        │   └── blogPosts.ts        # Artigos completos do blog
        │
        ├── context/
        │   └── AuthContext.tsx     # Gerenciamento de sessão e token PRO
        │
        └── types/
            ├── job.ts              # Interfaces Job, ContractType, WorkModel
            └── resume.ts           # Interfaces ResumeData, Experience, Education
```

---

## 4. Regras de Negócio e Funcionalidades Principais

### A. Catálogo e Filtro de Vagas
- **Volume:** Mais de **840 vagas reais** no Rio Grande do Norte ativas no catálogo.
- **Filtros Combináveis:**
  1. Busca textual por título, empresa ou bairro.
  2. Polo regional (`Natal`, `Mossoró`, `Parnamirim`, `Macaíba`, `São Gonçalo do Amarante`, `Currais Novos`, `Caicó`).
  3. Modalidade (`Presencial`, `Híbrido`, `Remoto`).
  4. **Filtro Especial "🌱 Sem Experiência / 1º Emprego":** Isola vagas de estágio, jovem aprendiz e oportunidades que explicitam não exigir experiência prévia.
- **Candidatura:** O usuário pode se candidatar via e-mail corporativo (com templates pré-formatados para Gmail e Outlook), link do site da empresa (Gupy, InfoJobs, etc.) ou WhatsApp direto do recrutador.

### B. Gerador de Currículos Profissionais (Resume Builder)
- **Modelo Gratuito ATS Clássico:** Desenvolvido para passar em sistemas de triagem automática (Robôs de RH como Gupy, Kenoby e Workable).
- **Modelos PRO:** Modelos *Moderno*, *Executivo* e *Minimalista* com foto, barras de competências e diagramação visual premium.
- **Integração WhatsApp:** Botão *"Enviar no WhatsApp"* que copia uma carta de apresentação formal já preenchida com as qualificações do candidato e abre a conversa do WhatsApp para anexar o PDF gerado.
- **Impressão Perfeita:** Regras CSS `@media print` otimizadas para gerar um arquivo PDF em folha padrão A4 impecável sem cortes de página indesejados.

### C. Motor de Monetização e Checkout Efí Bank
- **Pix Instantâneo:** Integrado com a API Pix da Efí Bank (antiga Gerencianet) através da chave Pix oficial `pix@natalvagas.com.br`.
- **Preços dos Planos de Currículo PRO:**
  - **Acesso Avulso (24h):** R$ 9,90
  - **Plano Mensal (30 dias):** R$ 39,90
  - **Plano Trimestral VIP:** R$ 99,90
- **Cartão de Crédito:** Formulário interativo com parcelamento em até 12x e validação de bandeira.
- **Ativação por Código:** Permite validar cupons e códigos de liberação direta gerados administrativamente.

### D. Redes Sociais & Canais de Distribuição (Em Lançamento)
- Comunidades integradas na home e no rodapé:
  - 🟢 **Grupo WhatsApp VIP** (Alertas instantâneos com permissão de envio apenas para administradores).
  - ✈️ **Canal Telegram** (Sem limite de 1.024 membros, histórico perpétuo).
  - 📸 **Instagram Oficial** (`@natalvagas.rn` ou `@natalvagasoficial` com links nas bios e stories).
  - 👥 **Página Facebook** (Compartilhamento nos grupos locais de empregos de Natal).
- Botão *"Quero ser avisado no lançamento VIP"* direcionando interessados diretamente para o WhatsApp de suporte `(84) 99234-4922`.

---

## 5. Estratégia de SEO e Google for Jobs

O portal foi construído como uma **máquina de atração orgânica** no Google:

1. **Schemas JSON-LD Injetados Dinamicamente:**
   - **ItemList na Home:** Lista as principais vagas com URLs canônicas.
   - **JobPosting em cada Vaga:** Inclui `title`, `description`, `datePosted`, `validThrough`, `employmentType` (FULL_TIME, INTERN, TEMPORARY, CONTRACTOR), `jobLocation` (Place, PostalAddress RN/BR), `hiringOrganization` e `directApply: true`. Isso garante rich snippets automáticos no **Google for Jobs**.
   - **FAQPage no FAQ:** Permite que perguntas e respostas apareçam diretamente como sanfonas nos resultados do Google.
2. **Sitemap XML Otimizado:** Mais de **5.100 URLs** indexadas no `frontend/public/sitemap.xml`.
3. **Core Web Vitals:** Paginação progressiva de 24 em 24 itens, imagens de logotipos lazy-loaded e scripts agrupados para atingir pontuações verdes no Google PageSpeed Insights.

---

## 6. Procedimentos de Operação e Comandos Úteis

### Rodar o Ambiente Local de Desenvolvimento:
```bash
cd frontend
npm install
npm run dev -- --port 5050
```
*Acesse em seu navegador: `http://localhost:5050`.*

### Compilar para Produção:
```bash
cd frontend
npm run build
```
*Gera o diretório otimizado `frontend/dist/`.*

### Minerar Novas Vagas no RN:
```bash
python3 scripts/fetch_500_rn_jobs.py
python3 scripts/generate_sitemap.py
```

### Publicação e Deploy Contínuo:
Todo commit ou merge enviado para a branch `main` no repositório GitHub dispara automaticamente a esteira de build e deploy no **Cloudflare Pages**:
```bash
git add .
git commit -m "feat: sua nova melhoria"
git push origin main
```

---

## 7. Contatos Oficiais & Parâmetros Operacionais

| Item | Valor |
| :--- | :--- |
| **E-mail de Suporte:** | `suporte@natalvagas.com.br` |
| **WhatsApp Oficial:** | `(84) 99234-4922` |
| **Chave Pix Oficial:** | `pix@natalvagas.com.br` |
| **Conta Efí Bank:** | `Conta Digital 427171 (Aplicação Produção Natal Vagas)` |
| **Google AdSense Pub ID:** | `pub-7415792754049263` |
| **Padrão de Largura:** | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (1280px) |

