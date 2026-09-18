#!/usr/bin/env python3
"""
Pre-Render Static Routes for Natal Vagas
Generates static index.html files inside dist/ for all SEO landing pages,
institutional pages, blog posts, and active job postings.
This ensures Cloudflare Pages serves pure 200 OK static files for Googlebot
instead of falling back to 404.html, solving all Google Search Console indexation issues.
"""

import os
import re
import json
import sys

# Ensure UTF-8 output encoding on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(repo_root, "frontend")
dist_dir = os.path.join(frontend_dir, "dist")
index_html_path = os.path.join(dist_dir, "index.html")

def main():
    print("[SEO] Iniciando pré-renderização estática de rotas para SEO...")
    
    if not os.path.exists(index_html_path):
        print(f"❌ {index_html_path} não encontrado! Rode o build do frontend primeiro.")
        return
        
    with open(index_html_path, "r", encoding="utf-8") as f:
        base_html = f.read()

    # Certifica remoção definitiva de dist/404.html
    dist_404 = os.path.join(dist_dir, "404.html")
    if os.path.exists(dist_404):
        os.remove(dist_404)
        print("🗑️ Removido dist/404.html para habilitar status 200 OK no Cloudflare Pages.")

    routes_to_generate = []

    # 1. Páginas Institucionais
    institutional = [
        ("criar-curriculo", "Criar Currículo Grátis em PDF — Natal Vagas", "Crie seu currículo profissional formatado em PDF gratuitamente pelo celular ou computador. Modelo aceito pelas empresas de Natal e RN."),
        ("sobre", "Quem Somos — Natal Vagas | O Portal de Empregos do RN", "Conheça a história e a missão do Natal Vagas: conectar candidatos e empresas do Rio Grande do Norte de forma 100% gratuita."),
        ("contato", "Fale Conosco — Natal Vagas", "Entre em contato com a equipe do Natal Vagas para dúvidas, sugestões, suporte e parcerias empresariais no RN."),
        ("dicas-seguranca", "Dicas de Segurança e Alertas Anti-Golpe — Natal Vagas", "Orientações importantes para identificar vagas seguras e se proteger de fraudes e golpes de falso emprego no RN."),
        ("politica-de-privacidade", "Política de Privacidade — Natal Vagas", "Política de privacidade, conformidade com a LGPD e diretrizes de publicidade do Google AdSense no Natal Vagas."),
        ("termos-de-uso", "Termos de Uso — Natal Vagas", "Termos e condições gerais de uso e navegação na plataforma de empregos Natal Vagas."),
        ("blog", "Blog & Notícias de Emprego no RN — Natal Vagas", "Artigos, guias práticos, notícias sobre o mercado de trabalho, SINE Natal e dicas de carreira no Rio Grande do Norte.")
    ]
    for path_slug, title, desc in institutional:
        routes_to_generate.append((path_slug, title, desc, f"https://natalvagas.com.br/{path_slug}"))

    # 2. Programmatic SEO Landing Pages
    seo_file = os.path.join(frontend_dir, "src", "data", "seoLandingPages.ts")
    if os.path.exists(seo_file):
        with open(seo_file, "r", encoding="utf-8") as f:
            content = f.read()
        matches = re.findall(r"slug:\s*'([^']+)',\s*path:\s*'([^']+)',\s*h1:\s*'([^']+)',\s*metaTitle:\s*'([^']+)',\s*metaDescription:\s*'([^']+)'", content)
        for slug, path_str, h1, meta_title, meta_desc in matches:
            clean_path = path_str.strip("/")
            routes_to_generate.append((clean_path, meta_title, meta_desc, f"https://natalvagas.com.br/{clean_path}"))

    # 3. Blog Posts
    blog_file = os.path.join(frontend_dir, "src", "data", "blogPosts.ts")
    if os.path.exists(blog_file):
        with open(blog_file, "r", encoding="utf-8") as f:
            blog_text = f.read()
        slug_matches = re.findall(r'"slug":\s*"([^"]+)",\s*"title":\s*"([^"]+)",\s*"excerpt":\s*"([^"]+)"', blog_text)
        for bslug, btitle, bexcerpt in slug_matches:
            b_path = f"blog/{bslug}"
            full_title = f"{btitle} — Natal Vagas"
            routes_to_generate.append((b_path, full_title, bexcerpt, f"https://natalvagas.com.br/{b_path}"))

    # 4. Vagas de Emprego Ativas (jobs.json)
    jobs_json = os.path.join(frontend_dir, "public", "data", "jobs.json")
    if os.path.exists(jobs_json):
        with open(jobs_json, "r", encoding="utf-8") as f:
            jobs_data = json.load(f)
        seen_slugs = set()
        for j in jobs_data:
            jslug = j.get('slug')
            if not jslug or jslug in seen_slugs:
                continue
            seen_slugs.add(jslug)
            jtitle = j.get('title', 'Vaga de Emprego')
            jcomp = j.get('companyName', 'Empresa Confidencial')
            jcity = j.get('city', 'Natal')
            jdesc = f"Vaga de {jtitle} na empresa {jcomp} em {jcity}/RN. Confira os requisitos e candidate-se gratuitamente no Natal Vagas."
            j_path = f"vaga/{jslug}"
            full_jtitle = f"{jtitle} em {jcity} ({jcomp}) — Natal Vagas"
            routes_to_generate.append((j_path, full_jtitle, jdesc, f"https://natalvagas.com.br/{j_path}"))

    count = 0
    for rel_path, title, desc, canonical_url in routes_to_generate:
        target_dir = os.path.join(dist_dir, rel_path)
        os.makedirs(target_dir, exist_ok=True)
        target_html = os.path.join(target_dir, "index.html")

        # Customizar meta tags do HTML base para o Googlebot ler diretamente
        custom_html = base_html
        custom_html = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', custom_html)
        custom_html = re.sub(r'<meta name="description" content=".*?"\s*/?>', f'<meta name="description" content="{desc}" />', custom_html)
        custom_html = re.sub(r'<link rel="canonical" href=".*?"\s*/?>', f'<link rel="canonical" href="{canonical_url}" />', custom_html)
        custom_html = re.sub(r'<meta property="og:title" content=".*?"\s*/?>', f'<meta property="og:title" content="{title}" />', custom_html)
        custom_html = re.sub(r'<meta property="og:description" content=".*?"\s*/?>', f'<meta property="og:description" content="{desc}" />', custom_html)
        custom_html = re.sub(r'<meta property="og:url" content=".*?"\s*/?>', f'<meta property="og:url" content="{canonical_url}" />', custom_html)
        custom_html = re.sub(r'<meta name="twitter:title" content=".*?"\s*/?>', f'<meta name="twitter:title" content="{title}" />', custom_html)
        custom_html = re.sub(r'<meta name="twitter:description" content=".*?"\s*/?>', f'<meta name="twitter:description" content="{desc}" />', custom_html)

        with open(target_html, "w", encoding="utf-8") as out:
            out.write(custom_html)
        count += 1

    print(f"✅ Sucesso! {count} páginas estáticas pré-renderizadas geradas em dist/ com status 200 OK nativo!")

if __name__ == "__main__":
    main()
