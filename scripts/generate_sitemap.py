import re
import json

initial_jobs_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/src/data/initialJobs.ts"
sitemap_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/public/sitemap.xml"

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
    '',
    '  <!-- URLs das Vagas Ativas no RN -->',
]

for job in records:
    slug = job.get('slug')
    pub = job.get('publishedAt') or today
    if len(pub) > 10:
        pub = pub[:10]
    xml_lines.extend([
        '  <url>',
        f'    <loc>{base_url}/vaga/{slug}</loc>',
        f'    <lastmod>{pub}</lastmod>',
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.9</priority>',
        '  </url>'
    ])

xml_lines.append('</urlset>')

xml_content = '\n'.join(xml_lines) + '\n'

with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write(xml_content)

print(f"Successfully generated sitemap with {len(records) + 6} URLs at {sitemap_path}")
