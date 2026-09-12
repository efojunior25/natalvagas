# File: BlogPost.tsx
- **Original Path:** `frontend/src/pages/BlogPost.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 267

---

```tsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { BLOG_POSTS } from '../data/blogPosts';
import { Calendar, Clock, Share2, FileText, ChevronRight, User, Sparkles } from 'lucide-react';

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Blog Natal Vagas`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', post.excerpt);
      }
      window.scrollTo(0, 0);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-lightBg">
        <Navbar onOpenPostJob={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Artigo não encontrado</h1>
          <p className="text-sm text-slate-500 mt-2">O artigo solicitado não existe ou foi movido.</p>
          <button
            onClick={() => navigate('/blog')}
            className="mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
          >
            Voltar para o Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShareWhatsApp = () => {
    const text = `Confira este artigo no Natal Vagas: *${post.title}*\n\nLeia completo em: https://natalvagas.com.br/blog/${post.slug}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Artigos relacionados
  const relatedPosts = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 3);

  // Schema.org NewsArticle para Google Notícias e Rich Results
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    image: [`https://natalvagas.com.br${post.coverImage}`],
    datePublished: `${post.publishedAt}T08:00:00-03:00`,
    dateModified: `${post.updatedAt || post.publishedAt}T08:00:00-03:00`,
    author: [{
      '@type': 'Organization',
      name: post.author.name,
      url: 'https://natalvagas.com.br'
    }],
    publisher: {
      '@type': 'Organization',
      name: 'Natal Vagas',
      logo: {
        '@type': 'ImageObject',
        url: 'https://natalvagas.com.br/assets/logo-natalvagas.jpg'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://natalvagas.com.br/blog/${post.slug}`
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg selection:bg-brand-500 selection:text-white">
      {/* Schema JSON-LD NewsArticle */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Navbar onOpenPostJob={() => {}} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        
        {/* Breadcrumbs */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-brand-600 transition-colors">Início</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/blog" className="hover:text-brand-600 transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
        </nav>

        <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-6 sm:p-10">
          
          {/* Cabeçalho do Artigo */}
          <header className="space-y-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-100">
                {post.categoryLabel}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="w-4 h-4 text-brand-600" />
                  <span>{post.author.name}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{post.publishedAt.split('-').reverse().join('/')}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{post.readTime}</span>
                </div>
              </div>

              {/* Botão de Compartilhar no WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compartilhar no WhatsApp</span>
              </button>
            </div>
          </header>

          {/* Imagem de Capa do Artigo */}
          <div className="my-8 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-96">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner AdSense In-Article */}
          <div className="my-6">
            <AdPlaceholder format="horizontal" />
          </div>

          {/* Conteúdo do Artigo */}
          <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed space-y-4">
            {post.content.map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h2 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 mt-8 mb-3">
                    {paragraph.replace('### ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('- ') || paragraph.startsWith('1. ') || paragraph.startsWith('2. ') || paragraph.startsWith('3. ') || paragraph.startsWith('4. ') || paragraph.startsWith('5. ')) {
                return (
                  <div key={idx} className="pl-4 py-1 text-slate-700 border-l-2 border-brand-300 bg-brand-50/20 rounded-r-lg">
                    <p dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                );
              }
              return (
                <p 
                  key={idx}
                  dangerouslySetInnerHTML={{ 
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-600 font-bold underline hover:text-brand-800">$1</a>')
                  }}
                />
              );
            })}
          </div>

          {/* Box de Ação / Criar Currículo */}
          <div className="mt-10 p-6 bg-gradient-to-r from-brand-50 via-white to-brand-50/50 rounded-2xl border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-brand-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Dica Prática Natal Vagas
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-1">
                Coloque estas dicas em prática agora mesmo!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gere seu currículo profissional aprovado por IA sem custos e candidate-se hoje às vagas do RN.
              </p>
            </div>
            <Link
              to="/criar-curriculo"
              className="shrink-0 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Criar Currículo Grátis</span>
            </Link>
          </div>

          {/* Tags do Artigo */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-400">Tags:</span>
            {post.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                #{tag}
              </span>
            ))}
          </div>

        </article>

        {/* Banner AdSense Pós-Artigo */}
        <div className="my-8">
          <AdPlaceholder format="horizontal" />
        </div>

        {/* Artigos Relacionados */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              Outros Artigos que Podem te Interessar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group block"
                >
                  <span className="text-[10px] font-bold text-brand-600 uppercase">
                    {rel.categoryLabel}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors mt-1 line-clamp-2">
                    {rel.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 mt-2 block">
                    {rel.readTime}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};
export default BlogPost;

```
