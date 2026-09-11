import re
import json
import os

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
initial_jobs_path = os.path.join(repo_root, "frontend", "src", "data", "initialJobs.ts")
sitemap_path = os.path.join(repo_root, "frontend", "public", "sitemap.xml")

with open(initial_jobs_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the records json array
m = re.search(r'const records:[^=]*=\s*(\[.*?\]);', content, re.DOTALL)
if not m:
    print("Could not find records in initialJobs.ts")
    exit(1)

records = json.loads(m.group(1))
print(f"Found {len(records)} jobs in initialJobs.ts")

base_url = "https://natalvagas.com.br"
today = "2026-09-10"

xml_lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <!-- Páginas Principais -->',
    '  <url>',
    f'    <loc>{base_url}/</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>daily</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/criar-curriculo</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>weekly</changefreq>',
    '    <priority>0.9</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/sobre</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/contato</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/dicas-seguranca</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/politica-de-privacidade</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.7</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/termos-de-uso</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.7</priority>',
    '  </url>',
    '  <url>',
    f'    <loc>{base_url}/blog</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>daily</changefreq>',
    '    <priority>0.9</priority>',
    '  </url>',
    '',
    '  <!-- URLs do Blog Guia de Carreira RN -->',
]

blog_posts_path = os.path.join(repo_root, "frontend", "src", "data", "blogPosts.ts")
if os.path.exists(blog_posts_path):
    with open(blog_posts_path, "r", encoding="utf-8") as f:
        blog_content = f.read()
    bm = re.search(r'export const blogPosts:\s*BlogPost\[\]\s*=\s*(\[.*?\]);', blog_content, re.DOTALL)
    if bm:
        blog_records = json.loads(bm.group(1))
        for bp in blog_records:
            bslug = bp.get('slug')
            bpub = bp.get('publishedAt') or today
            xml_lines.extend([
                '  <url>',
                f'    <loc>{base_url}/blog/{bslug}</loc>',
                f'    <lastmod>{bpub}</lastmod>',
                f'    <changefreq>monthly</changefreq>',
                '    <priority>0.8</priority>',
                '  </url>'
            ])

xml_lines.extend([
    '',
    '  <!-- URLs das Vagas Ativas no RN -->',
])

for job in records:
    slug = job.get('slug')
    pub = job.get('publishedAt') or today
    if len(pub) > 10:
        pub = pub[:10]
    xml_lines.extend([
        '  <url>',
        f'    <loc>{base_url}/vaga/{slug}</loc>',
        f'    <lastmod>{pub}</lastmod>',
        f'    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>'
    ])

xml_lines.append('</urlset>')
xml_lines.append('')

with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write('\n'.join(xml_lines))

print(f"Generated sitemap with {len(xml_lines)} lines at {sitemap_path}")

