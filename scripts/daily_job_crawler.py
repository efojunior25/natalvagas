#!/usr/bin/env python3
"""
Daily Job Crawler v3.0 — Natal Vagas
Busca contínua de vagas reais, estágios, jovem aprendiz e processos seletivos no RN.
Consome feeds de alta relevância (Google News RN, portais de carreira e vagas oficiais).
Projetado para execução 100% autônoma via GitHub Actions.
"""

import urllib.request
import json
import re
import os
import sys
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import time

try:
    from ai_job_curator import curate_job_with_gemini
except ImportError:
    from scripts.ai_job_curator import curate_job_with_gemini

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jobs_json_file = os.path.join(repo_root, "frontend", "public", "data", "jobs.json")

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[-\s]+', '-', text).strip('-')

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

def fetch_rss_feed(url: str):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NatalVagasCrawler/3.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            xml_data = res.read()
            root = ET.fromstring(xml_data)
            return root.findall('.//item')
    except Exception as e:
        print(f"⚠️ Erro ao consultar feed RSS {url}: {e}")
        return []

def main():
    print("🤖 Iniciando Daily Job Crawler v3.0 — Natal Vagas...")
    
    if not os.path.exists(jobs_json_file):
        print(f"❌ Catálogo {jobs_json_file} não encontrado!")
        sys.exit(1)
        
    with open(jobs_json_file, "r", encoding="utf-8") as f:
        existing_records = json.load(f)
        
    print(f"📦 Catálogo atual: {len(existing_records)} vagas carregadas.")
    
    existing_slugs = {j.get('slug') for j in existing_records if j.get('slug')}
    existing_keys = {
        re.sub(r'\W+', '', f"{j.get('title', '')}_{j.get('city', '')}").lower()
        for j in existing_records
    }
    
    current_max_id = max([j.get('id', 0) for j in existing_records] + [2026090000])
    
    # 1. Consulta feeds RSS de notícias e oportunidades no RN
    rss_queries = [
        "vagas+emprego+natal+rn",
        "concurso+processo+seletivo+rn",
        "estagio+jovem+aprendiz+natal+rn"
    ]
    
    new_jobs = []
    
    for q in rss_queries:
        url = f"https://news.google.com/rss/search?q={q}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        items = fetch_rss_feed(url)
        print(f"🔎 Query '{q}': {len(items)} publicações encontradas.")
        
        for it in items:
            raw_title = it.find('title').text if it.find('title') is not None else ""
            link = it.find('link').text if it.find('link') is not None else ""
            pub_date_str = it.find('pubDate').text if it.find('pubDate') is not None else ""
            desc_node = it.find('description')
            desc = clean_html(desc_node.text) if desc_node is not None and desc_node.text else ""
            
            if not raw_title or not link:
                continue
                
            # Extrai veículo/fonte (ex: "... - G1")
            source_match = re.search(r'\s*-\s*([A-Za-z0-9À-ÿ\s.]+)$', raw_title)
            company_source = source_match.group(1).strip() if source_match else "Portal Parceiro RN"
            clean_title = re.sub(r'\s*-\s*[A-Za-z0-9À-ÿ\s.]+$', '', raw_title).strip()
            
            # Bloqueia veículos de imprensa e sites de notícias jornalísticas
            blocked_news_sources = {
                'g1', 'tribunadonorte.com.br', 'agorarn', 'agora rn', 'portal 98 fm natal',
                'portal 96fm', 'blog do gustavo negreiros', 'blog gran cursos online',
                'gran cursos online', 'estratégia concursos', 'estrategia concursos',
                'qconcursos folha dirigida', 'qconcursos', 'folha dirigida', 'direção concursos',
                'portal diário do rn', 'diário do rn', 'pciconcursos.com.br', 'jcconcursos.com.br',
                'natal em foco', 'natalemfoco.com.br', 'bnews rn', 'bnews', 'opoti.com.br',
                'novonoticias.com'
            }
            if company_source.lower() in blocked_news_sources:
                continue

            # Bloqueia títulos com manchetes jornalísticas
            title_lower = clean_title.lower()
            news_patterns = [
                'mantém geração', 'cria empregos', 'queda em', 'tudo sobre as vagas',
                'previstas para', 'puxam crescimento', 'quando dados viram', 'deve abrir',
                'são convocados para posse', 'convoca', 'publica retificação', 'locais de prova',
                'saldo de empregos', 'gera postos', 'feira de empregabilidade'
            ]
            if any(np in title_lower for np in news_patterns):
                continue
                
            # Filtro de relevância para vagas e seleções no RN
            relevant_keywords = ['vaga', 'emprego', 'contrata', 'concurso', 'estágio', 'estagio', 'aprendiz', 'oportunidade', 'seleção', 'seletivo', 'edital', 'inscriç']
            if not any(kw in title_lower for kw in relevant_keywords):
                continue
                
            city = parse_city(desc, clean_title)
            t_key = re.sub(r'\W+', '', f"{clean_title}_{city}").lower()
            if t_key in existing_keys:
                continue
                
            contract_type = parse_contract_type(clean_title, desc)
            work_model = parse_work_model(desc)
            
            # Curadoria e Auditoria com Gemini AI (Free Tier)
            raw_input = f"Título: {clean_title}\nFonte: {company_source}\nDetalhes: {desc}\nLink Oficial: {link}"
            try:
                ai_data = curate_job_with_gemini(raw_input)
                # Respeita o limite do plano gratuito do Google AI Studio
                time.sleep(4)
            except Exception as e:
                print(f"⚠️ Aviso ao consultar Gemini: {e}")
                ai_data = {"is_valid_job": True}

            if not ai_data.get("is_valid_job", True):
                print(f"🗑️ Descartada pela IA (não é vaga real ou é notícia): {clean_title}")
                continue

            # Atualiza com as informações normalizadas pela IA
            title_final = ai_data.get("title") or clean_title
            company_final = ai_data.get("companyName") or company_source
            city_final = ai_data.get("city") or city
            neighborhood_final = ai_data.get("neighborhood")
            contract_final = ai_data.get("contractType") or contract_type
            model_final = ai_data.get("workModel") or work_model
            reqs_final = ai_data.get("requirements") or "Verifique os requisitos, prazos e documentos necessários no canal oficial da oportunidade."
            bens_final = ai_data.get("benefits") or "Benefícios informados no processo seletivo oficial."
            only_no_exp = ai_data.get("onlyNoExperience", False)
            is_pcd_flag = ai_data.get("isPcd", False)

            # Trata data de publicação
            try:
                dt = datetime.strptime(pub_date_str[:16], "%a, %d %b %Y")
                published_iso = dt.strftime("%Y-%m-%d")
            except Exception:
                published_iso = datetime.now().strftime("%Y-%m-%d")
                
            current_max_id += 1
            slug = f"{slugify(title_final)}-{slugify(company_final)}-{slugify(city_final)}-{current_max_id}"
            
            if slug in existing_slugs:
                continue
                
            description_text = f"{desc}\n\nOportunidade oficial apurada e divulgada no Rio Grande do Norte por {company_final}. Acesse o canal oficial para conferir edital, requisitos e detalhes de inscrição."
            
            job_obj = {
                "id": current_max_id,
                "title": title_final,
                "slug": slug,
                "companyName": company_final,
                "companyLogoUrl": ai_data.get("companyLogoUrl"),
                "companyWebsite": ai_data.get("companyWebsite"),
                "companyInstagram": ai_data.get("companyInstagram"),
                "city": city_final,
                "neighborhood": neighborhood_final,
                "state": "RN",
                "workModel": model_final,
                "contractType": contract_final,
                "description": description_text,
                "requirements": reqs_final,
                "benefits": bens_final,
                "salaryCurrency": "BRL",
                "hideSalary": True,
                "applicationChannel": "LINK",
                "applicationTarget": link,
                "isFeatured": ("concurso" in title_lower or "edital" in title_lower),
                "isPcd": is_pcd_flag,
                "onlyNoExperience": only_no_exp,
                "publishedAt": published_iso
            }
            
            new_jobs.append(job_obj)
            existing_slugs.add(slug)
            existing_keys.add(t_key)
            
            # Limite diário expandido para capturar até 100 novas oportunidades por dia
            if len(new_jobs) >= 100:
                break
        if len(new_jobs) >= 100:
            break
            
    print(f"✨ Novas vagas identificadas hoje: {len(new_jobs)}")
    
    if new_jobs:
        # Coloca as novas vagas no topo do catálogo
        updated_catalog = new_jobs + existing_records
        
        with open(jobs_json_file, "w", encoding="utf-8") as f:
            json.dump(updated_catalog, f, ensure_ascii=False, indent=2)
            
        print(f"🎉 Catálogo atualizado com sucesso! Total agora: {len(updated_catalog)} vagas.")
    else:
        print("ℹ️ Nenhuma nova vaga no momento. Catálogo já está 100% atualizado.")

if __name__ == "__main__":
    main()
