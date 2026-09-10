#!/usr/bin/env python3
"""
Robô Alimentador de Vagas Reais do RN - Natal Vagas
Coleta oportunidades reais de trabalho em Natal e no RN a partir de feeds públicos,
decodifica e-mails protegidos e atualiza automaticamente o catálogo de vagas e o sitemap.
"""

import urllib.request
import json
import re
import os
import sys
import unicodedata
from datetime import datetime

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')

def decode_cloudflare_email(encoded: str) -> str:
    try:
        r = int(encoded[:2], 16)
        return "".join([chr(int(encoded[i:i+2], 16) ^ r) for i in range(2, len(encoded), 2)])
    except Exception:
        return ""

def clean_html(html_text: str) -> str:
    text = re.sub(r'<br\s*/?>', '\n', html_text)
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'</li>', '\n', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&')
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_job_title_and_company(raw_title: str):
    # Formatos comuns: "Cargo - Empresa | Cidade", "Cargo - Empresa", "Cargo | Cidade"
    parts = [p.strip() for p in raw_title.split('|')]
    city = "Natal"
    if len(parts) > 1:
        city_candidate = parts[-1].strip()
        if any(c in city_candidate.lower() for c in ['natal', 'parnamirim', 'mossoro', 'macaiba', 'ceara-mirim', 'sao goncalo', 'tirol', 'alecrim', 'candelaria', 'capim macio', 'ponta negra']):
            city = city_candidate

    main_part = parts[0]
    sub_parts = [s.strip() for s in main_part.split(' - ')]
    if len(sub_parts) >= 2:
        title = sub_parts[0]
        company = sub_parts[1]
    else:
        title = main_part
        company = "Empresa Confidencial / Parceira"

    # Limpeza de sufixos de data como [02/11]
    title = re.sub(r'\[.*?\]', '', title).strip()
    company = re.sub(r'\[.*?\]', '', company).strip()

    return title, company, city

def fetch_feed_jobs(max_results=50):
    url = f"https://www.empregodorn.com.br/feeds/posts/default?alt=json&max-results={max_results}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NatalVagasBot/1.0"
    })
    
    jobs = []
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            entries = data.get('feed', {}).get('entry', [])
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Encontradas {len(entries)} postagens brutas no feed.")
            
            for entry in entries:
                raw_title = entry.get('title', {}).get('$t', '')
                if not raw_title or 'depoimento' in raw_title.lower() or 'curso' in raw_title.lower():
                    continue

                html_content = entry.get('content', {}).get('$t', '')
                published = entry.get('published', {}).get('$t', '')[:10]

                # Decodifica e-mails
                cf_matches = re.findall(r'data-cfemail="([a-f0-9]+)"', html_content)
                decoded_emails = [decode_cloudflare_email(m) for m in cf_matches]
                plain_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', html_content)
                valid_emails = [e for e in set(decoded_emails + plain_emails) if 'sentry' not in e and 'google' not in e]

                title, company, city = parse_job_title_and_company(raw_title)
                cleaned_desc = clean_html(html_content)

                # Determina canal de candidatura
                if valid_emails:
                    app_channel = "EMAIL"
                    app_target = valid_emails[0]
                else:
                    links = [l.get('href') for l in entry.get('link', []) if l.get('rel') == 'alternate']
                    app_channel = "LINK"
                    app_target = links[0] if links else "https://natalvagas.com.br"

                slug = f"{slugify(title)}-{slugify(company)}-{slugify(city)}"

                job_obj = {
                    "id": len(jobs) + 1,
                    "title": title,
                    "slug": slug,
                    "description": cleaned_desc[:800] if len(cleaned_desc) > 800 else cleaned_desc,
                    "companyName": company,
                    "companyLogoUrl": "https://natalvagas.com.br/assets/logo-natalvagas.jpg",
                    "city": "Natal" if "natal" in city.lower() else city,
                    "neighborhood": city if "natal" not in city.lower() else "Região Metropolitana",
                    "workModel": "PRESENCIAL",
                    "contractType": "CLT",
                    "applicationChannel": app_channel,
                    "applicationTarget": app_target,
                    "status": "APPROVED",
                    "isFeatured": False,
                    "publishedAt": published,
                    "createdAt": f"{published}T10:00:00Z"
                }
                jobs.append(job_obj)

    except Exception as e:
        print(f"Erro ao consultar feed: {e}")

    return jobs

def main():
    print("=== INICIANDO ROBÔ ALIMENTADOR DE VAGAS DO RN ===")
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    initial_jobs_file = os.path.join(repo_root, "frontend", "src", "data", "initialJobs.ts")

    fetched = fetch_feed_jobs(max_results=60)
    print(f"Vagas extraídas e validadas: {len(fetched)}")

    # Carrega dados existentes
    with open(initial_jobs_file, "r", encoding="utf-8") as f:
        content = f.read()

    m = re.search(r'const records:[^=]*=\s*(\[.*?\]);', content, re.DOTALL)
    if not m:
        print("Erro ao localizar array de registros em initialJobs.ts")
        sys.exit(1)

    existing_records = json.loads(m.group(1))
    print(f"Vagas atualmente registradas no portal: {len(existing_records)}")

    # Mescla evitando duplicidade por slug ou título + empresa
    existing_slugs = {j.get('slug') for j in existing_records}
    new_jobs_added = 0

    next_id = max([j.get('id', 0) for j in existing_records] + [0]) + 1

    for job in fetched:
        if job['slug'] not in existing_slugs and not any(
            j.get('title', '').lower() == job['title'].lower() and j.get('companyName', '').lower() == job['companyName'].lower()
            for j in existing_records
        ):
            job['id'] = next_id
            next_id += 1
            existing_records.append(job)
            existing_slugs.add(job['slug'])
            new_jobs_added += 1

    print(f"Novas vagas inéditas adicionadas: {new_jobs_added}")
    print(f"Total consolidado de vagas ativas no Natal Vagas: {len(existing_records)}")

    # Salva de volta no initialJobs.ts
    new_json = json.dumps(existing_records, indent=2, ensure_ascii=False)
    updated_content = re.sub(
        r'(const records:[^=]*=\s*)\[.*?\];',
        r'\1' + new_json.replace('\\', '\\\\') + ';',
        content,
        flags=re.DOTALL
    )

    with open(initial_jobs_file, "w", encoding="utf-8") as f:
        f.write(updated_content)

    # Regenera sitemap automaticamente
    sitemap_script = os.path.join(repo_root, "scripts", "generate_sitemap.py")
    os.system(f'python3 "{sitemap_script}"')
    print("=== ROBÔ CONCLUÍDO COM SUCESSO! ===")

if __name__ == "__main__":
    main()
