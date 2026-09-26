#!/usr/bin/env python3
"""
Sanitize Jobs Database — Natal Vagas (Fase 1)
Remove notícias jornalísticas, artigos e conteúdos sem canal de candidatura real,
corrige nomes de empresas truncados pelo scraping e padroniza a base de dados.
"""

import json
import os
import re
import shutil

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jobs_json_file = os.path.join(repo_root, "frontend", "public", "data", "jobs.json")
backup_file = os.path.join(repo_root, "frontend", "public", "data", "jobs.json.bak")

# Veículos de imprensa e sites de notícias/cursos que não são empregadores diretos
NEWS_DOMAINS_AND_COMPANIES = {
    'g1', 'tribunadonorte.com.br', 'agorarn', 'agora rn', 'portal 98 fm natal',
    'portal 96fm', 'blog do gustavo negreiros', 'blog gran cursos online',
    'gran cursos online', 'estratégia concursos', 'estrategia concursos',
    'qconcursos folha dirigida', 'qconcursos', 'folha dirigida', 'direção concursos',
    'portal diário do rn', 'diário do rn', 'pciconcursos.com.br', 'jcconcursos.com.br',
    'natal em foco', 'natalemfoco.com.br', 'bnews rn', 'bnews', 'opoti.com.br',
    'novonoticias.com', 'news.google.com'
}

# Termos no título que caracterizam reportagens/notícias jornalísticas e não vagas de emprego
NEWS_TITLE_PATTERNS = [
    r'mantém geração',
    r'cria empregos',
    r'queda em\s+[a-z]+',
    r'tudo sobre as vagas',
    r'previstas para\s+20\d\d',
    r'puxam crescimento',
    r'quando dados viram',
    r'deve abrir\s+\d+',
    r'são convocados para posse',
    r'convoca \d+ novos',
    r'publica retificação',
    r'locais de prova',
    r'saldo de empregos',
    r'gera \d+ novos postos',
    r'feira de empregabilidade oferece',
    r'feira de empregabilidade no rn',
    r'realizam feira de empregabilidade',
    r'observatório do emprego',
    r'tem mais de \d+ vagas de emprego abertas;\s*confira',
    r'páscoa deve abrir',
    r'candidatos convocados',
    r'gabarito preliminar',
    r'resultado final homologado'
]

def is_news_or_invalid(job: dict) -> bool:
    company = job.get('companyName', '').strip().lower()
    title = job.get('title', '').strip().lower()
    target = job.get('applicationTarget', '').strip().lower()
    channel = job.get('applicationChannel', '')
    
    # 1. Se o canal for LINK apontando para portal de notícias ou Google News
    if channel == 'LINK':
        if any(nd in target for nd in NEWS_DOMAINS_AND_COMPANIES):
            return True
        if any(nd in company for nd in NEWS_DOMAINS_AND_COMPANIES):
            return True
            
    # 2. Se a empresa for explicitamente um veículo de notícias
    if company in NEWS_DOMAINS_AND_COMPANIES:
        return True
        
    # 3. Se o título contiver padrões clássicos de manchetes de jornal
    for pattern in NEWS_TITLE_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return True
            
    return False

def clean_and_fix_job(job: dict) -> dict:
    company = job.get('companyName', '').strip()
    title = job.get('title', '').strip()
    
    # Corrige empresas fictícias geradas por parsing de páginas
    if company.lower() in ['como se candidatar', 'rn: envie seu currículo!', 'vagas em natal: envie seu currículo!', 'vagas de emprego em natal e rn']:
        # Tenta extrair a empresa do título: "Trabalhe no Carrefour" -> Empresa: Carrefour
        m = re.search(r'Trabalhe n[ao]\s+([A-Za-z0-9À-ÿ\s&]+)', title, re.IGNORECASE)
        if m:
            extracted_company = m.group(1).strip()
            job['companyName'] = extracted_company
            job['title'] = f"Banco de Talentos / Trabalhe Conosco - {extracted_company}"
        elif 'RedeMAIS' in title:
            job['companyName'] = 'RedeMAIS'
            job['title'] = 'Banco de Talentos - Supermercados RedeMAIS'
        else:
            job['companyName'] = 'Empresa Confidencial / Parceira'
            
    # Limpa sufixos de títulos (ex: "- Mar Vermelho Atacado" repetido no título)
    comp_clean = job.get('companyName', '')
    if comp_clean and comp_clean != 'Empresa Confidencial / Parceira' and comp_clean != 'Empresa Confidencial':
        job['title'] = re.sub(rf'\s*-\s*{re.escape(comp_clean)}\s*$', '', job['title'], flags=re.IGNORECASE).strip()
        
    # Normaliza bairros ou cidades
    if not job.get('city') or job.get('city') == 'RN':
        job['city'] = 'Natal'
        
    return job

def main():
    print("🧹 Iniciando processo de higienização da base de vagas do Natal Vagas...")
    
    if not os.path.exists(jobs_json_file):
        print(f"❌ Arquivo {jobs_json_file} não encontrado.")
        return
        
    # 1. Faz backup seguro
    shutil.copyfile(jobs_json_file, backup_file)
    print(f"💾 Backup de segurança salvo em: {backup_file}")
    
    with open(jobs_json_file, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
        
    initial_count = len(jobs)
    print(f"📊 Total de vagas antes da limpeza: {initial_count}")
    
    cleaned_jobs = []
    removed_news_count = 0
    fixed_companies_count = 0
    
    for j in jobs:
        if is_news_or_invalid(j):
            removed_news_count += 1
            continue
            
        old_comp = j.get('companyName', '')
        j = clean_and_fix_job(j)
        if j.get('companyName') != old_comp:
            fixed_companies_count += 1
            
        cleaned_jobs.append(j)
        
    final_count = len(cleaned_jobs)
    print(f"🗑️ Notícias jornalísticas e artigos removidos: {removed_news_count}")
    print(f"🔧 Empresas e títulos corrigidos e padronizados: {fixed_companies_count}")
    print(f"✅ Total de vagas reais e legítimas no catálogo: {final_count}")
    
    # 2. Salva a base higienizada
    with open(jobs_json_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_jobs, f, ensure_ascii=False, indent=2)
        
    print(f"🎉 Catálogo {jobs_json_file} atualizado com sucesso!")

if __name__ == '__main__':
    main()
