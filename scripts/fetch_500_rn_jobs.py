#!/usr/bin/env python3
"""
Script de Ingestão de 500+ Vagas Reais do RN para o Natal Vagas
Busca em feeds públicos de empregos do RN, decodifica e-mails, limpa HTML,
categoriza cidades e salva no catálogo oficial de vagas.
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
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&quot;', '"')
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_city(text: str, title: str):
    full = (title + " " + text).lower()
    cidades_rn = [
        ("Parnamirim", ["parnamirim", "cohabinal", "nova parnamirim", "eulalia"]),
        ("Mossoró", ["mossoro", "mossoró"]),
        ("Macaíba", ["macaiba", "macaíba"]),
        ("São Gonçalo do Amarante", ["sao goncalo", "são gonçalo", "aeroporto"]),
        ("Ceará-Mirim", ["ceara-mirim", "ceará-mirim", "ceara mirim"]),
        ("Caicó", ["caico", "caicó", "seridó"]),
        ("Currais Novos", ["currais novos"]),
        ("Assú", ["assu", "açu"]),
        ("Extremoz", ["extremoz", "pitangui"]),
        ("Tibau do Sul / Pipa", ["tibau do sul", "praia da pipa", "pipa"]),
        ("Natal", ["natal", "alecrim", "tirol", "midway", "ponta negra", "capim macio", "candelaria", "candelária", "zona norte", "zona sul", "zona leste", "zona oeste", "cidade alta"])
    ]
    for cid, keys in cidades_rn:
        for k in keys:
            if k in full:
                return cid
    return "Natal"

def parse_work_model(text: str):
    lower = text.lower()
    if "remoto" in lower or "home office" in lower or "100% home" in lower:
        return "REMOTO"
    if "hibrid" in lower or "híbrid" in lower:
        return "HIBRIDO"
    return "PRESENCIAL"

def parse_contract_type(text: str):
    lower = text.lower()
    if "estágio" in lower or "estagio" in lower:
        return "ESTAGIO"
    if "jovem aprendiz" in lower or "aprendiz" in lower:
        return "JOVEM_APRENDIZ"
    if "pj" in lower or "prestador de serviço" in lower:
        return "PJ"
    if "temporário" in lower or "temporario" in lower:
        return "TEMPORARIO"
    return "CLT"

def parse_title_and_company(raw_title: str):
    # Formatos: "Cargo - Empresa | Cidade", "Cargo - Empresa", "Cargo | Cidade"
    parts = [p.strip() for p in raw_title.split('|')]
    main = parts[0]
    
    sub = [s.strip() for s in main.split(' - ')]
    if len(sub) >= 2:
        title = sub[0]
        company = sub[1]
    else:
        title = main
        company = "Empresa Confidencial / Parceira"
        
    title = re.sub(r'\[.*?\]', '', title).strip()
    title = re.sub(r'\(.*?\)', '', title).strip()
    company = re.sub(r'\[.*?\]', '', company).strip()
    
    if not title:
        title = raw_title
    return title, company

def fetch_feed_batch(base_url, start_index, max_results):
    url = f"{base_url}?alt=json&start-index={start_index}&max-results={max_results}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 NatalVagasBot/2.0"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode('utf-8'))
            return data.get('feed', {}).get('entry', [])
    except Exception as e:
        print(f"Erro em {url}: {e}")
        return []

def main():
    print("=== INICIANDO COLETA DE 500+ VAGAS NO RN ===")
    
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    initial_jobs_file = os.path.join(repo_root, "frontend", "src", "data", "initialJobs.ts")
    
    # 1. Carrega dados existentes
    with open(initial_jobs_file, "r", encoding="utf-8") as f:
        content = f.read()

    m = re.search(r'const records:\s*JobRecord\[\]\s*=\s*(\[.*?\]);', content, re.DOTALL)
    if not m:
        print("Erro: Não encontrou bloco records em initialJobs.ts")
        sys.exit(1)
        
    existing_records = json.loads(m.group(1))
    print(f"Total de vagas atuais em catálogo: {len(existing_records)}")
    
    existing_slugs = set(r.get('slug') for r in existing_records)
    existing_titles = set(r.get('title', '').strip().lower() for r in existing_records)
    
    # Encontra maior ID atual
    max_id = 2026091100
    for r in existing_records:
        rid = r.get('id')
        if isinstance(rid, int) and rid > max_id:
            max_id = rid
            
    print(f"Maior ID atual: {max_id}")
    
    collected_entries = []
    
    # 2. Busca paginada no feed do Emprego do RN
    # Cada página pode trazer até 150 vagas
    base_empregodorn = "https://www.empregodorn.com.br/feeds/posts/default"
    for start_idx in [1, 151, 301, 451, 601]:
        print(f"Consultando empregodorn.com.br (start={start_idx})...")
        batch = fetch_feed_batch(base_empregodorn, start_idx, 150)
        print(f"-> Retornados {len(batch)} itens.")
        collected_entries.extend(batch)
        if len(batch) < 50:
            break
            
    # 3. Busca no feed do Vagas Empregos Natal
    base_vagasnatal = "https://www.vagasempregosnatal.com.br/feeds/posts/default"
    print(f"Consultando vagasempregosnatal.com.br (start=1)...")
    batch2 = fetch_feed_batch(base_vagasnatal, 1, 150)
    print(f"-> Retornados {len(batch2)} itens.")
    collected_entries.extend(batch2)
    
    print(f"\nTotal bruto de postagens coletadas: {len(collected_entries)}")
    
    new_jobs = []
    current_id = max_id + 1
    
    for entry in collected_entries:
        raw_title = entry.get('title', {}).get('$t', '').strip()
        if not raw_title or len(raw_title) < 4:
            continue
            
        lower_t = raw_title.lower()
        if any(bad in lower_t for bad in ['depoimento', 'curso gratis', 'dica de', 'resultado', 'gabarito', 'como funciona', 'informe publicitário']):
            continue
            
        html_content = entry.get('content', {}).get('$t', '')
        published = entry.get('published', {}).get('$t', '')[:10]
        if not published:
            published = datetime.now().strftime('%Y-%m-%d')
            
        title, company = parse_title_and_company(raw_title)
        
        # Evita duplicados por título exato
        t_key = f"{title.lower()}_{company.lower()}"
        if t_key in existing_titles:
            continue
            
        # Emails protegidos
        cf_matches = re.findall(r'data-cfemail="([a-f0-9]+)"', html_content)
        decoded_emails = [decode_cloudflare_email(m) for m in cf_matches]
        plain_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', html_content)
        valid_emails = [e for e in set(decoded_emails + plain_emails) if 'sentry' not in e and 'google' not in e and 'blogger' not in e]
        
        cleaned_desc = clean_html(html_content)
        if len(cleaned_desc) < 30:
            continue
            
        city = parse_city(cleaned_desc, title)
        work_model = parse_work_model(cleaned_desc)
        contract_type = parse_contract_type(cleaned_desc + " " + title)
        
        # Canal de candidatura
        if valid_emails:
            app_channel = "EMAIL"
            app_target = valid_emails[0]
        else:
            links = [l.get('href') for l in entry.get('link', []) if l.get('rel') == 'alternate']
            app_channel = "LINK"
            app_target = links[0] if links else "https://natalvagas.com.br"
            
        slug = f"{slugify(title)}-{slugify(company)}-{slugify(city)}-{current_id}"
        if slug in existing_slugs:
            continue
            
        # Tenta extrair requisitos ou benefícios
        req_match = re.search(r'(?:requisitos|exig[êe]ncias|perfil)[^\n:]*[:\n]+(.*?)(?=\n\s*(?:benef[íi]cios|sal[áa]rio|hor[áa]rio|atividades|como se candidatar|$))', cleaned_desc, re.IGNORECASE | re.DOTALL)
        requirements = req_match.group(1).strip()[:300] if req_match else None
        
        ben_match = re.search(r'(?:benef[íi]cios|oferece|vantagens)[^\n:]*[:\n]+(.*?)(?=\n\s*(?:requisitos|hor[áa]rio|atividades|como se candidatar|$))', cleaned_desc, re.IGNORECASE | re.DOTALL)
        benefits = ben_match.group(1).strip()[:200] if ben_match else None

        job_obj = {
            "id": current_id,
            "title": title[:70],
            "slug": slug,
            "companyName": company[:50],
            "companyLogoUrl": "https://natalvagas.com.br/assets/logo-natalvagas.jpg",
            "city": city,
            "neighborhood": "Grande Natal" if city == "Natal" else city,
            "workModel": work_model,
            "contractType": contract_type,
            "description": cleaned_desc[:1200],
            "applicationChannel": app_channel,
            "applicationTarget": app_target,
            "publishedAt": published,
            "expiresAt": "2026-10-31T23:59:59-03:00"
        }
        
        if requirements:
            job_obj["requirements"] = requirements
        if benefits:
            job_obj["benefits"] = benefits
            
        new_jobs.append(job_obj)
        existing_slugs.add(slug)
        existing_titles.add(t_key)
        current_id += 1
        
    print(f"\n Novas vagas prontas para inserção: {len(new_jobs)}")
    
    # Se alcançamos uma quantidade significativa, gravamos
    if len(new_jobs) > 0:
        all_records = existing_records + new_jobs
        print(f"Total consolidado de vagas: {len(all_records)}")
        
        # Reconstrói o arquivo initialJobs.ts
        json_str = json.dumps(all_records, ensure_ascii=False, indent=2)
        new_content = content[:m.start(1)] + json_str + content[m.end(1):]
        
        with open(initial_jobs_file, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        print(" initialJobs.ts atualizado com sucesso!")
    else:
        print("Nenhuma nova vaga encontrada para adicionar.")

if __name__ == "__main__":
    main()
