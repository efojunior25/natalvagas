#!/usr/bin/env python3
"""
Daily Job Crawler v3.5 — Natal Vagas
Busca contínua de vagas reais, estágios, jovem aprendiz e processos seletivos no RN.
Consome feeds de alta relevância:
1. Emprego do RN (feed JSON direto de vagas abertas com e-mails decodificados).
2. Google News RN (concursos, estágios, processos seletivos).
3. Curadoria resiliente com Gemini + fallback heurístico instantâneo.
4. Atualização automática do sitemap e catálogo oficial.
"""

import urllib.request
import json
import re
import os
import sys
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime
import time

try:
    from ai_job_curator import curate_job_with_gemini, resolve_company_logo
except ImportError:
    from scripts.ai_job_curator import curate_job_with_gemini, resolve_company_logo

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
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', "'")
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_city(text: str, title: str) -> str:
    full = (title + " " + text).lower()
    cidades_rn = [
        ("Parnamirim", ["parnamirim", "cohabinal", "nova parnamirim"]),
        ("Mossoró", ["mossoro", "mossoró"]),
        ("Macaíba", ["macaiba", "macaíba"]),
        ("São Gonçalo do Amarante", ["sao goncalo", "são gonçalo", "aeroporto"]),
        ("Ceará-Mirim", ["ceara-mirim", "ceará-mirim", "ceara mirim"]),
        ("Caicó", ["caico", "caicó", "seridó"]),
        ("Currais Novos", ["currais novos"]),
        ("Assú", ["assu", "açu"]),
        ("Extremoz", ["extremoz", "pitangui"]),
        ("Tibau do Sul / Pipa", ["tibau do sul", "praia da pipa", "pipa"]),
        ("Nísia Floresta", ["nisia floresta", "nísia floresta"]),
        ("São José de Mipibu", ["sao jose de mipibu", "são josé de mipibu"]),
        ("Tangará", ["tangará", "tangara"]),
        ("Natal", ["natal", "alecrim", "tirol", "midway", "ponta negra", "capim macio", "candelaria", "candelária", "zona norte", "zona sul", "zona leste", "zona oeste", "cidade alta"])
    ]
    for cid, keys in cidades_rn:
        for k in keys:
            if k in full:
                return cid
    return "Natal"

def parse_contract_type(title: str, text: str) -> str:
    full = (title + " " + text).lower()
    if "estágio" in full or "estagio" in full:
        return "ESTAGIO"
    if "aprendiz" in full:
        return "JOVEM_APRENDIZ"
    if "concurso" in full or "processo seletivo" in full or "edital" in full:
        return "TEMPORARIO"
    if "pj" in full or "prestador" in full:
        return "PJ"
    return "CLT"

def parse_work_model(text: str) -> str:
    lower = text.lower()
    if "remoto" in lower or "home office" in lower or "100% home" in lower:
        return "REMOTO"
    if "híbrido" in lower or "hibrido" in lower:
        return "HIBRIDO"
    return "PRESENCIAL"

def parse_job_title_and_company(raw_title: str):
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

    title = re.sub(r'\[.*?\]', '', title).strip()
    company = re.sub(r'\[.*?\]', '', company).strip()
    return title, company, city

def fetch_rss_feed(url: str):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NatalVagasCrawler/3.5"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            xml_data = res.read()
            root = ET.fromstring(xml_data)
            return root.findall('.//item')
    except Exception as e:
        print(f"⚠️ Erro ao consultar feed RSS {url}: {e}")
        return []

def fetch_empregodorn_jobs(max_results=60):
    url = f"https://www.empregodorn.com.br/feeds/posts/default?alt=json&max-results={max_results}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NatalVagasCrawler/3.5"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('feed', {}).get('entry', [])
    except Exception as e:
        print(f"⚠️ Erro ao consultar feed Emprego do RN: {e}")
        return []

def main():
    print("🤖 Iniciando Daily Job Crawler v3.5 — Natal Vagas...")
    
    if not os.path.exists(jobs_json_file):
        print(f"❌ Catálogo {jobs_json_file} não encontrado!")
        sys.exit(1)
        
    with open(jobs_json_file, "r", encoding="utf-8") as f:
        existing_records = json.load(f)
        
    print(f"📦 Catálogo atual: {len(existing_records)} vagas carregadas.")
    
    existing_slugs = {j.get('slug') for j in existing_records if j.get('slug')}
    existing_keys = {
        re.sub(r'\W+', '', f"{j.get('title', '')}_{j.get('companyName', '')}_{j.get('city', '')}").lower()
        for j in existing_records
    }
    
    current_max_id = max([j.get('id', 0) for j in existing_records] + [2026090000])
    new_jobs = []

    # =========================================================================
    # FONTE 1: Feed Emprego do RN (Vagas hiper-locais com e-mails decodificados)
    # =========================================================================
    print("\n🔍 [Fonte 1] Coletando feed direto de vagas no RN...")
    rn_entries = fetch_empregodorn_jobs(max_results=60)
    print(f"📋 Total de postagens recebidas: {len(rn_entries)}")

    for entry in rn_entries:
        raw_title = entry.get('title', {}).get('$t', '')
        if not raw_title or 'depoimento' in raw_title.lower() or 'curso' in raw_title.lower():
            continue

        html_content = entry.get('content', {}).get('$t', '')
        pub_date = entry.get('published', {}).get('$t', '')[:10] or datetime.now().strftime("%Y-%m-%d")

        # Decodifica e-mails
        cf_matches = re.findall(r'data-cfemail="([a-f0-9]+)"', html_content)
        decoded_emails = [decode_cloudflare_email(m) for m in cf_matches]
        plain_emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', html_content)
        valid_emails = [e for e in set(decoded_emails + plain_emails) if 'sentry' not in e and 'google' not in e and 'blogger' not in e]

        # Telefones WhatsApp
        phones = re.findall(r'\(?84\)?\s*9?\d{4}[-\s]?\d{4}', html_content)

        title, company, city = parse_job_title_and_company(raw_title)
        city_detected = parse_city(html_content, raw_title)
        if city_detected and city == "Natal":
            city = city_detected

        cleaned_desc = clean_html(html_content)

        t_key = re.sub(r'\W+', '', f"{title}_{company}_{city}").lower()
        if t_key in existing_keys:
            continue

        # Canal de candidatura
        if valid_emails:
            app_channel = "EMAIL"
            app_target = valid_emails[0]
        elif phones:
            app_channel = "WHATSAPP"
            clean_phone = re.sub(r'\D', '', phones[0])
            app_target = clean_phone if clean_phone.startswith("55") else f"55{clean_phone}"
        else:
            links = [l.get('href') for l in entry.get('link', []) if l.get('rel') == 'alternate']
            app_channel = "LINK"
            app_target = links[0] if links else "https://natalvagas.com.br"

        current_max_id += 1
        slug = f"{slugify(title)}-{slugify(company)}-{slugify(city)}-{current_max_id}"
        if slug in existing_slugs:
            continue

        contract = parse_contract_type(title, cleaned_desc)
        model = parse_work_model(cleaned_desc)

        job_obj = {
            "id": current_max_id,
            "title": title,
            "slug": slug,
            "companyName": company,
            "companyLogoUrl": resolve_company_logo(company),
            "city": city,
            "neighborhood": city if "natal" not in city.lower() else "Região Metropolitana",
            "state": "RN",
            "workModel": model,
            "contractType": contract,
            "description": cleaned_desc,
            "requirements": "Verifique os requisitos completos no anúncio oficial da vaga.",
            "benefits": "Informados no processo seletivo.",
            "salaryCurrency": "BRL",
            "hideSalary": True,
            "applicationChannel": app_channel,
            "applicationTarget": app_target,
            "isFeatured": False,
            "isPcd": "pcd" in raw_title.lower() or "defici" in cleaned_desc.lower(),
            "onlyNoExperience": "sem experiência" in cleaned_desc.lower() or "sem experiencia" in cleaned_desc.lower(),
            "publishedAt": pub_date
        }

        new_jobs.append(job_obj)
        existing_slugs.add(slug)
        existing_keys.add(t_key)
        print(f"  ✅ Nova vaga [EmpregoRN]: {title} ({company}) - {city}")

    # =========================================================================
    # FONTE 2: Google News RN (Concursos, estágios, jovem aprendiz)
    # =========================================================================
    print("\n🔍 [Fonte 2] Coletando seleções e estágios do Google News RN...")
    rss_queries = [
        "vagas+emprego+natal+rn",
        "concurso+processo+seletivo+rn",
        "estagio+jovem+aprendiz+natal+rn"
    ]

    blocked_news_sources = {
        'g1', 'tribunadonorte.com.br', 'agorarn', 'agora rn', 'portal 98 fm natal',
        'portal 96fm', 'blog do gustavo negreiros', 'blog gran cursos online',
        'gran cursos online', 'estratégia concursos', 'estrategia concursos',
        'qconcursos folha dirigida', 'qconcursos', 'folha dirigida', 'direção concursos',
        'portal diário do rn', 'diário do rn', 'pciconcursos.com.br', 'jcconcursos.com.br',
        'natal em foco', 'natalemfoco.com.br', 'bnews rn', 'bnews', 'opoti.com.br',
        'novonoticias.com'
    }

    news_patterns = [
        'mantém geração', 'cria empregos', 'queda em', 'tudo sobre as vagas',
        'previstas para', 'puxam crescimento', 'quando dados viram', 'deve abrir',
        'são convocados para posse', 'convoca', 'publica retificação', 'locais de prova',
        'saldo de empregos', 'gera postos', 'feira de empregabilidade'
    ]

    for q in rss_queries:
        url = f"https://news.google.com/rss/search?q={q}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        items = fetch_rss_feed(url)
        print(f"🔎 Query '{q}': {len(items)} itens.")

        for it in items:
            raw_title = it.find('title').text if it.find('title') is not None else ""
            link = it.find('link').text if it.find('link') is not None else ""
            pub_date_str = it.find('pubDate').text if it.find('pubDate') is not None else ""
            desc_node = it.find('description')
            desc = clean_html(desc_node.text) if desc_node is not None and desc_node.text else ""

            if not raw_title or not link:
                continue

            source_match = re.search(r'\s*-\s*([A-Za-z0-9À-ÿ\s.]+)$', raw_title)
            company_source = source_match.group(1).strip() if source_match else "Portal Parceiro RN"
            clean_title = re.sub(r'\s*-\s*[A-Za-z0-9À-ÿ\s.]+$', '', raw_title).strip()

            if company_source.lower() in blocked_news_sources:
                continue

            title_lower = clean_title.lower()
            if any(np in title_lower for np in news_patterns):
                continue

            relevant_keywords = ['vaga', 'emprego', 'contrata', 'concurso', 'estágio', 'estagio', 'aprendiz', 'oportunidade', 'seleção', 'seletivo', 'edital', 'inscriç']
            if not any(kw in title_lower for kw in relevant_keywords):
                continue

            city = parse_city(desc, clean_title)
            t_key = re.sub(r'\W+', '', f"{clean_title}_{company_source}_{city}").lower()
            if t_key in existing_keys:
                continue

            current_max_id += 1
            slug = f"{slugify(clean_title)}-{slugify(company_source)}-{slugify(city)}-{current_max_id}"
            if slug in existing_slugs:
                continue

            contract_type = parse_contract_type(clean_title, desc)
            work_model = parse_work_model(desc)

            try:
                dt = datetime.strptime(pub_date_str[:16], "%a, %d %b %Y")
                published_iso = dt.strftime("%Y-%m-%d")
            except Exception:
                published_iso = datetime.now().strftime("%Y-%m-%d")

            description_text = f"{desc}\n\nOportunidade oficial apurada e divulgada no Rio Grande do Norte por {company_source}. Acesse o canal oficial para conferir edital, requisitos e detalhes de inscrição."

            job_obj = {
                "id": current_max_id,
                "title": clean_title,
                "slug": slug,
                "companyName": company_source,
                "companyLogoUrl": resolve_company_logo(company_source),
                "city": city,
                "neighborhood": city if "natal" not in city.lower() else "Região Metropolitana",
                "state": "RN",
                "workModel": work_model,
                "contractType": contract_type,
                "description": description_text,
                "requirements": "Verifique os requisitos, prazos e documentos necessários no canal oficial da oportunidade.",
                "benefits": "Informados no edital / canal oficial.",
                "salaryCurrency": "BRL",
                "hideSalary": True,
                "applicationChannel": "LINK",
                "applicationTarget": link,
                "isFeatured": ("concurso" in title_lower or "edital" in title_lower),
                "isPcd": "pcd" in title_lower,
                "onlyNoExperience": "sem experiência" in title_lower or "jovem aprendiz" in title_lower,
                "publishedAt": published_iso
            }

            new_jobs.append(job_obj)
            existing_slugs.add(slug)
            existing_keys.add(t_key)
            print(f"  ✅ Nova oportunidade [GoogleNews]: {clean_title} ({company_source}) - {city}")

            if len(new_jobs) >= 80:
                break
        if len(new_jobs) >= 80:
            break

    print(f"\n✨ Novas vagas identificadas hoje: {len(new_jobs)}")

    if new_jobs:
        updated_catalog = new_jobs + existing_records
        with open(jobs_json_file, "w", encoding="utf-8") as f:
            json.dump(updated_catalog, f, ensure_ascii=False, indent=2)
        print(f"🎉 Catálogo atualizado com sucesso! Total agora: {len(updated_catalog)} vagas.")

        # Regenera sitemap automaticamente
        sitemap_script = os.path.join(repo_root, "scripts", "generate_sitemap.py")
        if os.path.exists(sitemap_script):
            print("🗺️ Regenerando sitemap.xml...")
            os.system(f'python3 "{sitemap_script}"')
    else:
        print("ℹ️ Nenhuma vaga nova inédita no momento. O catálogo já está 100% atualizado com as últimas publicações.")

if __name__ == "__main__":
    main()
