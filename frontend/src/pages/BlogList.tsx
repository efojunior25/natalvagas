import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { BLOG_POSTS } from '../data/blogPosts';
import { BookOpen, Calendar, Clock, ArrowRight, Sparkles, ChevronRight, Search } from 'lucide-react';

export const BlogList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    document.title = 'Blog Natal Vagas — Notícias de Emprego, Carreiras e Dicas no RN';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Notícias sobre mercado de trabalho em Natal e no Rio Grande do Norte. Dicas de currículo, agendamento no SINE, vagas de jovem aprendiz e preparação para entrevistas.'
      );
    }
  }, []);

  const categories = [
    { id: 'TODOS', label: 'Todos os Artigos' },
    { id: 'DICAS_CURRICULO', label: 'Dicas de Currículo' },
    { id: 'SINE_BENEFICIOS', label: 'SINE & Benefícios' },
    { id: 'JOVEM_APRENDIZ', label: 'Jovem Aprendiz' },
    { id: 'ENTREVISTAS', label: 'Entrevistas' },
    { id: 'MERCADO_RN', label: 'Mercado no RN' }
  ];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchCat = selectedCategory === 'TODOS' || post.category === selectedCategory;
      const matchQuery = 
        !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const featuredPost = BLOG_POSTS.find(p => p.isFeatured) || BLOG_POSTS[0];

  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg selection:bg-brand-500 selection:text-white">
      <Navbar onOpenPostJob={() => {}} />

      {/* Hero do Blog */}
      <header className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-surface-lightBg py-10 sm:py-14 border-b border-slate-200">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4 border border-brand-200">
            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>Blog & Carreiras no RN</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Notícias de Emprego, Guias e <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
              Dicas Profissionais no RN
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Informações verificadas sobre processos seletivos locais, agendamento no SINE Natal, primeiros empregos e modelos de currículo de alta conversão.
          </p>

          {/* Campo de Busca Rápida no Blog */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artigos por tema (ex: SINE, currículo, jovem aprendiz)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-brand-500 focus:outline-hidden shadow-xs"
            />
          </div>

          {/* Categorias com Rolagem Suave no Celular */}
          <div className="mt-6 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Banner AdSense Topo */}
        <div className="mb-8">
          <AdPlaceholder format="horizontal" />
        </div>

        {/* Artigo em Destaque Principal (Quando não estiver filtrando por texto) */}
        {!searchQuery && selectedCategory === 'TODOS' && featuredPost && (
          <article className="mb-10 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group">
            <Link to={`/blog/${featuredPost.slug}`} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 h-56 md:h-full min-h-[220px] relative overflow-hidden bg-slate-100">
                <img
                  src={featuredPost.coverImage}
                  alt={featuredPost.coverImageAlt}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />
                <span className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow-xs">
                  Artigo em Destaque
                </span>
              </div>

              <div className="md:col-span-7 p-6 sm:p-8 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-brand-600 font-bold uppercase">{featuredPost.categoryLabel}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {featuredPost.publishedAt.split('-').reverse().join('/')}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {featuredPost.excerpt}
                </p>

                <div className="pt-2 flex items-center gap-1.5 text-sm font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                  <span>Ler artigo completo</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </article>
        )}

        {/* Grid de Artigos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article 
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group"
            >
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="h-44 overflow-hidden relative bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                    {post.categoryLabel}
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    <span>•</span>
                    <span>{post.publishedAt.split('-').reverse().join('/')}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </Link>

              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Por {post.author.name}</span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="font-bold text-brand-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Ler</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
            <p className="text-base font-bold text-slate-700">Nenhum artigo encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente buscar por termos mais genéricos.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('TODOS');
              }}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
            >
              Ver todos os artigos
            </button>
          </div>
        )}

        {/* Banner de Conversão para o Criador de Currículos */}
        <div className="mt-12 bg-gradient-to-r from-brand-600 via-brand-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-brand-900/10">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-200" />
              <span>Ferramenta Gratuita do Natal Vagas</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black leading-tight">
              Ainda não tem um currículo nos padrões dos recrutadores do RN?
            </h3>
            <p className="text-xs sm:text-sm text-brand-100 mt-2 leading-relaxed">
              Crie seu currículo otimizado pelo celular em menos de 5 minutos, baixe em PDF e passe direto pelos robôs de seleção das empresas.
            </p>
          </div>

          <Link
            to="/criar-curriculo"
            className="shrink-0 px-6 py-3.5 bg-white text-brand-700 hover:bg-brand-50 active:scale-98 font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Criar Meu Currículo Grátis
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
};
export default BlogList;
