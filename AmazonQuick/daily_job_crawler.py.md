# File: daily_job_crawler.py
- **Original Path:** `scripts/daily_job_crawler.py`
- **Language / Type:** `python`
- **Lines of Code:** 271

---

```python
#!/usr/bin/env python3
"""
Daily Job Crawler — Natal Vagas
Busca as publicações mais recentes nos feeds oficiais do Rio Grande do Norte,
identifica vagas inéditas, higieniza os dados e atualiza o catálogo jobs.json.
Projetado para execução rápida e automática via GitHub Actions.
"""

import urllib.request
import json
import re
import os
import sys
import unicodedata
from datetime import datetime

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jobs_json_file = os.path.join(repo_root, "frontend", "public", "data", "jobs.json")

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

def parse_city(text: str, title: str) -> str:
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

def parse_work_model(text: str) -> str:
    lower = text.lower()
    if "remoto" in lower or "home office" in lower or "100% home" in lower:
        return "REMOTO"
    if "híbrido" in lower or "hibrido" in lower:
        return "HIBRIDO"
    return "PRESENCIAL"

def parse_contract_type(title: str, text: str) -> str:
    full = (title + " " + text).lower()
    if "estágio" in full or "estagio" in full:
        return "ESTAGIO"
    if "aprendiz" in full:
        return "JOVEM_APRENDIZ"
    if "temporário" in full or "temporario" in full:
        return "TEMPORARIO"
    if "pj" in full or "prestador" in full:
        return "PJ"
    return "CLT"

def extract_salary(text: str):
    m = re.search(r'R\$\s*([\d\.,]+)', text)
    if m:
        val_str = m.group(1).replace('.', '').replace(',', '.')
        try:
            val = float(val_str)
            if 500 <= val <= 25000:
                return val, val
        except ValueError:
            pass
    return None, None

def extract_contacts(raw_html: str, text: str):
    cf_matches = re.findall(r'data-cfemail="([a-fA-F0-9]+)"', raw_html)
    emails = []
    for cf in cf_matches:
        dec = decode_cloudflare_email(cf)
        if dec and '@' in dec:
            emails.append(dec.strip())
            
    plain_emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    for em in plain_emails:
        clean_em = em.lower().strip()
        if not clean_em.endswith(('png', 'jpg', 'jpeg', 'gif', 'js', 'css')) and clean_em not in emails:
            emails.append(clean_em)
            
    phones = re.findall(r'(?:\(?\s*84\s*\)?\s*)?(?:9\s*)?[89]\d{3}[-\s]?\d{4}', text)
    cleaned_phones = []
    for p in phones:
        digits = re.sub(r'\D', '', p)
        if len(digits) in [8, 9, 10, 11]:
            if not digits.startswith('84'):
                if len(digits) == 9:
                    digits = '84' + digits
                elif len(digits) == 8:
                    digits = '849' + digits
            cleaned_phones.append(digits)
            
    return list(set(emails)), list(set(cleaned_phones))

def fetch_feed(url: str):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NatalVagasCrawler/2.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"⚠️ Erro ao consultar feed {url}: {e}")
        return None

def main():
    print("🤖 Iniciando Daily Job Crawler — Natal Vagas...")
    
    if not os.path.exists(jobs_json_file):
        print(f"❌ Catálogo {jobs_json_file} não encontrado!")
        sys.exit(1)
        
    with open(jobs_json_file, "r", encoding="utf-8") as f:
        existing_records = json.load(f)
        
    print(f"📦 Catálogo atual: {len(existing_records)} vagas carregadas.")
    
    existing_slugs = {j.get('slug') for j in existing_records if j.get('slug')}
    existing_keys = {
        re.sub(r'\W+', '', f"{j.get('title', '')}_{j.get('companyName', '')}").lower()
        for j in existing_records
    }
    
    current_max_id = max([j.get('id', 0) for j in existing_records] + [2026090000])
    
    # Consulta os feeds mais recentes (últimas publicações)
    feed_urls = [
        "https://www.empregodorn.com.br/feeds/posts/default?alt=json&max-results=50",
        "https://www.vagasempregosnatal.com.br/feeds/posts/default?alt=json&max-results=50"
    ]
    
    entries = []
    for f_url in feed_urls:
        data = fetch_feed(f_url)
        if data and 'feed' in data and 'entry' in data['feed']:
            entries.extend(data['feed']['entry'])
            
    print(f"🔎 Encontradas {len(entries)} publicações recentes nos feeds.")
    
    new_jobs = []
    for entry in entries:
        raw_title = entry.get('title', {}).get('$t', '').strip()
        if not raw_title:
            continue
            
        content_obj = entry.get('content') or entry.get('summary') or {}
        raw_html = content_obj.get('$t', '')
        text = clean_html(raw_html)
        
        # Limpa título
        title = raw_title
        title = re.sub(r'^(?:vaga\s*de\s*(?:emprego|estágio|estagio)?\s*para|vaga\s*de|oportunidade\s*para|urgente:?)\s*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*-\s*natal\s*(?:e\s*região|e\s*grande\s*natal|/rn)?\s*$', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*-\s*rn\s*$', '', title, flags=re.IGNORECASE)
        title = title.strip(' -–—:').title()
        
        # Extrai empresa
        company = "Empresa Confidencial"
        m_comp = re.search(r'(?:empresa|clínica|loja|restaurante|supermercado|hospital|indústria|escola|hotel)\s*(?:parceira|local|confidencial)?\s*:\s*([A-Za-z0-9À-ÿ\s&.-]+)', text, re.IGNORECASE)
        if m_comp:
            c_name = m_comp.group(1).strip()
            if 3 < len(c_name) < 40 and not any(kw in c_name.lower() for kw in ['requisitos', 'atividades', 'benefícios', 'salário']):
                company = c_name.title()
                
        t_key = re.sub(r'\W+', '', f"{title}_{company}").lower()
        if t_key in existing_keys:
            continue
            
        published = entry.get('published', {}).get('$t', datetime.now().isoformat())
        if len(published) > 10:
            published = published[:10]
            
        city = parse_city(text, raw_title)
        work_model = parse_work_model(text)
        contract_type = parse_contract_type(title, text)
        sal_min, sal_max = extract_salary(text)
        emails, phones = extract_contacts(raw_html, text)
        
        current_max_id += 1
        slug = f"{slugify(title)}-{slugify(company)}-{slugify(city)}-{current_max_id}"
        
        if slug in existing_slugs:
            continue
            
        # Determina canal de candidatura
        if emails:
            app_channel = "EMAIL"
            app_target = emails[0]
        elif phones:
            app_channel = "WHATSAPP"
            app_target = phones[0]
        else:
            orig_link = ""
            for l in entry.get('link', []):
                if l.get('rel') == 'alternate':
                    orig_link = l.get('href', '')
                    break
            app_channel = "LINK"
            app_target = orig_link or "https://natalvagas.com.br"
            
        job_obj = {
            "id": current_max_id,
            "title": title,
            "slug": slug,
            "companyName": company,
            "city": city,
            "state": "RN",
            "workModel": work_model,
            "contractType": contract_type,
            "description": text[:1500] if len(text) > 1500 else text,
            "salaryMin": sal_min,
            "salaryMax": sal_max,
            "salaryCurrency": "BRL",
            "hideSalary": (sal_min is None),
            "applicationChannel": app_channel,
            "applicationTarget": app_target,
            "publishedAt": published,
            "expiresAt": "2026-12-31T23:59:59-03:00",
            "status": "APPROVED",
            "isFeatured": False
        }
        
        new_jobs.append(job_obj)
        existing_slugs.add(slug)
        existing_keys.add(t_key)
        
    print(f"✨ Novas vagas identificadas: {len(new_jobs)}")
    
    if len(new_jobs) > 0:
        # Coloca as novas vagas no início para aparecerem primeiro
        updated_records = new_jobs + existing_records
        with open(jobs_json_file, "w", encoding="utf-8") as f:
            json.dump(updated_records, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Catálogo jobs.json atualizado com sucesso! Total consolidado: {len(updated_records)} vagas.")
        # Código de saída 0 com flag
        sys.exit(0)
    else:
        print("ℹ️ Nenhuma nova vaga no momento. Catálogo já está 100% atualizado.")
        sys.exit(0)

if __name__ == "__main__":
    main()

```
