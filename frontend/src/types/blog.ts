export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'DICAS_CURRICULO' | 'SINE_BENEFICIOS' | 'MERCADO_RN' | 'JOVEM_APRENDIZ' | 'ENTREVISTAS';
  categoryLabel: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  coverImage: string;
  coverImageAlt: string;
  content: string[]; // Parágrafos em markdown/HTML simplificado
  tags: string[];
  isFeatured?: boolean;
}
