import { Job } from '../types/job';

// Conferidas nas páginas oficiais em 10/09/2026. Datas são as da fonte.
const common = {
  state: 'RN', salaryCurrency: 'BRL', hideSalary: true,
  applicationChannel: 'LINK', status: 'APPROVED', isFeatured: false,
  viewsCount: 0, createdAt: '2026-09-10T12:00:00-03:00', verifiedAt: '2026-09-10',
} as const;
const records: Omit<Job, keyof typeof common | 'applicationTarget'>[] = [
  {
    id: 12338956, title: 'Jovem Aprendiz', slug: 'jovem-aprendiz-ftd-natal-12338956',
    companyName: 'FTD Educação', city: 'Natal', workModel: 'PRESENCIAL', contractType: 'JOVEM_APRENDIZ',
    description: 'Aprendizagem com acompanhamento profissional na FTD Educação. Atuação presencial na Av. Almirante Alexandrino de Alencar, 862, em Natal.',
    requirements: 'Ensino médio concluído ou cursando à noite. Noções de Office, familiaridade com ferramentas digitais, organização e disponibilidade presencial.',
    benefits: 'Vale-refeição ou alimentação, vale-transporte, plano de saúde e seguro de vida.',
    sourceName: 'FTD Educação · Gupy', sourceUrl: 'https://vempraftd.gupy.io/jobs/12338956?jobBoardSource=gupy_public_page',
    publishedAt: '2026-09-07', expiresAt: '2026-10-08T23:59:59-03:00',
  },
  {
    id: 58413, title: 'Operador de Movimentação e Armazenagem', slug: 'operador-armazenagem-martins-parnamirim-58413',
    companyName: 'Martins', city: 'Parnamirim', workModel: 'PRESENCIAL', contractType: 'NAO_INFORMADO',
    description: 'Carga e descarga, movimentação, separação e expedição de mercadorias. Apoio ao inventário e conferência de validade dos produtos. Contratação efetiva; jornada de segunda a sábado.',
    requirements: 'Ensino fundamental e experiência na função são desejáveis. Documentação em dia e residência em Parnamirim ou cidades próximas.',
    benefits: 'Assistência médica e odontológica, auxílio-alimentação, vale-transporte, convênios com farmácias e academias e previdência privada.',
    sourceName: 'Martins · Portal de Carreiras', sourceUrl: 'https://prd-pc1.lg.com.br/Vagas/c/24BD8FC2-EA53-452C-9295-5B86EA0C79A6/p/vemsergentemartins/pt-BR/Vaga/Divulgacao?codigo=ZQhI5JJUaUQ%3D',
    publishedAt: '2026-09-02', expiresAt: '2026-09-17T23:59:59-03:00',
  },
  {
    id: 3634931, title: 'Líder de Setor — Frente de Caixa', slug: 'lider-frente-caixa-atacadao-parnamirim-3634931',
    companyName: 'Atacadão', city: 'Parnamirim', workModel: 'PRESENCIAL', contractType: 'CLT',
    description: 'Gestão da frente de caixa, escalas, atendimento e indicadores. Resolução de conflitos e controle das operações. Uma posição, com jornada parcial à noite.',
    requirements: 'Ensino médio e experiência em liderança e gestão de equipes. Comunicação e resolução de problemas. Superior em Administração ou áreas afins é desejável.',
    benefits: 'Assistência médica e odontológica, refeição no local, vale-transporte, seguro de vida, participação nos resultados e TotalPass, entre outros informados na fonte.',
    sourceName: 'Atacadão · Pandapé', sourceUrl: 'https://atacadao.pandape.infojobs.com.br/Detail/3634931', publishedAt: '2026-09-01',
  },
  {
    id: 12218745, title: 'Coordenador de Operações', slug: 'coordenador-operacoes-partage-mossoro-12218745',
    companyName: 'Grupo Partage', city: 'Mossoró', workModel: 'NAO_INFORMADO', contractType: 'NAO_INFORMADO',
    description: 'Coordenação de manutenção e operações do empreendimento em Mossoró, com acompanhamento de obras, fornecedores, consumo de energia e água e desenvolvimento da equipe.',
    requirements: 'Experiência em operações, preferencialmente em shopping centers. Formação técnica ou superior em Elétrica, Eletrônica ou Mecânica, ou Engenharia Civil. Disponibilidade para viagens; pós-graduação é desejável.',
    benefits: 'Vale-refeição, vale-transporte, assistência médica e seguro de vida.',
    sourceName: 'Grupo Partage · Gupy', sourceUrl: 'https://partage.gupy.io/jobs/12218745?jobBoardSource=gupy_public_page',
    publishedAt: '2026-08-21', expiresAt: '2026-11-30T23:59:59-03:00',
  },
  {
    id: 11987718, title: 'Estágio em Engenharia Civil, Produção e Arquitetura', slug: 'estagio-mrv-parnamirim-11987718',
    companyName: 'MRV&CO', city: 'Parnamirim', workModel: 'PRESENCIAL', contractType: 'ESTAGIO', salaryMin: 1150, salaryMax: 1700,
    description: 'Apoio ao acompanhamento de obras, leitura de projetos, levantamentos quantitativos, relatórios e controle de qualidade. Bolsa de R$ 1.150 para 4 horas diárias ou R$ 1.700 para 6 horas diárias.',
    requirements: 'Graduação em andamento em Engenharia Civil, Arquitetura, Engenharia de Produção Civil ou Engenharia de Produção. Conhecimento de Office e disponibilidade de 4 ou 6 horas por dia.',
    benefits: 'Vale-lanche, folga no mês de aniversário, capacitações, descontos e programas de incentivo à atividade física e saúde mental.',
    sourceName: 'MRV&CO · Gupy', sourceUrl: 'https://programadeestagiomrveco.gupy.io/jobs/11987718?jobBoardSource=gupy_public_page',
    publishedAt: '2026-08-17', expiresAt: '2026-10-06T23:59:59-03:00',
  },
];
export const INITIAL_REAL_JOBS: Job[] = records.map(job => ({
  ...common, ...job, applicationTarget: job.sourceUrl!, hideSalary: !job.salaryMin,
}));
