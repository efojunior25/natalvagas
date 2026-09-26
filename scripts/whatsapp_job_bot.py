#!/usr/bin/env python3
"""
Robô Automatizado de Divulgação de Vagas no WhatsApp — Natal Vagas
------------------------------------------------------------------
Lê as vagas mais recentes de `frontend/public/data/jobs.json`, formata mensagens
otimizadas para grupos e canais do WhatsApp e dispara via Evolution API / Z-API
ou gera os links diretos para transmissão manual/agendada.

Uso:
    python3 scripts/whatsapp_job_bot.py --preview           # Visualiza as mensagens geradas
    python3 scripts/whatsapp_job_bot.py --limit 5           # Processa até 5 vagas
    python3 scripts/whatsapp_job_bot.py --dry-run           # Simula o envio sem disparar
    python3 scripts/whatsapp_job_bot.py --send              # Envia via API conectada
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOBS_FILE = os.path.join(BASE_DIR, 'frontend', 'public', 'data', 'jobs.json')
HISTORY_FILE = os.path.join(BASE_DIR, 'scripts', '.posted_whatsapp_jobs.json')

# Configurações de Integração WhatsApp (Evolution API / Z-API / WPPConnect / Webhook)
WA_API_URL = os.environ.get('WHATSAPP_API_URL', '').rstrip('/')
WA_API_KEY = os.environ.get('WHATSAPP_API_KEY', '')
WA_INSTANCE = os.environ.get('WHATSAPP_INSTANCE', 'natalvagas')
WA_GROUPS_RAW = os.environ.get('WHATSAPP_GROUP_IDS', '')
WA_COMMUNITY_LINK = os.environ.get('WHATSAPP_COMMUNITY_LINK', 'https://whatsapp.com/channel/0029Vb8fAyN4o7qURPaBIN2B')
WA_CHANNEL_ID = os.environ.get('WHATSAPP_CHANNEL_ID', '0029Vb8fAyN4o7qURPaBIN2B')

def load_jobs():
    if not os.path.exists(JOBS_FILE):
        print(f"❌ Arquivo de vagas não encontrado em {JOBS_FILE}")
        return []
    try:
        with open(JOBS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Erro ao ler vagas: {e}")
        return []

def load_posted_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()

def save_posted_history(history):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(history), f, indent=2)
    except Exception as e:
        print(f"⚠️ Erro ao salvar histórico de postagens: {e}")

def format_whatsapp_message(job, is_channel=False):
    title = job.get('title', 'Vaga de Emprego').strip()
    company = job.get('companyName', 'Empresa Confidencial').strip()
    city = job.get('city', 'Natal').strip()
    neighborhood = job.get('neighborhood')
    local_str = f"{city} - RN" + (f" ({neighborhood})" if neighborhood else "")
    
    contract = job.get('contractType', 'CLT')
    work_model = job.get('workModel', 'PRESENCIAL')
    
    # Salário
    if not job.get('hideSalary') and (job.get('salaryMin') or job.get('salaryMax')):
        s_min = job.get('salaryMin')
        s_max = job.get('salaryMax')
        if s_min and s_max:
            salary_str = f"R$ {s_min:,.2f} a R$ {s_max:,.2f}".replace('.', ',')
        elif s_min:
            salary_str = f"A partir de R$ {s_min:,.2f}".replace('.', ',')
        else:
            salary_str = f"Até R$ {s_max:,.2f}".replace('.', ',')
    else:
        salary_str = "A combinar / Compatível com o mercado"
        
    slug = job.get('slug', '')
    job_url = f"https://natalvagas.com.br/vaga/{slug}" if slug else "https://natalvagas.com.br"
    
    # Resumo dos requisitos (primeiras 3 linhas limpas)
    reqs_raw = job.get('requirements', '')
    req_bullets = []
    if reqs_raw:
        lines = [line.strip().lstrip('•-* ') for line in reqs_raw.split('\n') if line.strip()]
        for l in lines[:3]:
            req_bullets.append(f"• {l}")
    
    req_text = "\n".join(req_bullets) if req_bullets else "• Detalhes e perfil no link oficial"

    if is_channel:
        footer = (
            f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🔗 *Confira mais vagas e envie seu currículo:*\n"
            f"👉 https://natalvagas.com.br\n\n"
            f"📄 *Crie seu currículo grátis em PDF:*\n"
            f"👉 https://natalvagas.com.br/criar-curriculo"
        )
    else:
        footer = (
            f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📢 *Receba vagas diárias no Canal Oficial:*\n"
            f"👉 {WA_COMMUNITY_LINK}\n\n"
            f"🔗 Mais vagas no mural oficial:\n"
            f"👉 https://natalvagas.com.br"
        )

    msg = (
        f"🚨 *NOVA OPORTUNIDADE EM {city.upper()} / RN*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💼 *Cargo:* {title}\n"
        f"🏢 *Empresa:* {company}\n"
        f"📍 *Local:* {local_str}\n"
        f"📄 *Contrato:* {contract} ({work_model.capitalize()})\n"
        f"💰 *Remuneração:* {salary_str}\n\n"
        f"📌 *Principais Requisitos:*\n"
        f"{req_text}\n\n"
        f"📲 *COMO SE CANDIDATAR (100% GRATUITO):*\n"
        f"Acesse o link oficial no Natal Vagas para enviar seu currículo diretamente para a empresa:\n\n"
        f"👉 {job_url}\n\n"
        f"{footer}"
    )
    return msg

def send_whatsapp_message(group_id, message):
    """
    Envia mensagem via Evolution API ou serviço compatível
    """
    if not WA_API_URL or not WA_API_KEY:
        print("ℹ️ Variáveis WHATSAPP_API_URL e WHATSAPP_API_KEY não configuradas.")
        return False
        
    endpoint = f"{WA_API_URL}/message/sendText/{WA_INSTANCE}"
    payload = {
        "number": group_id,
        "text": message,
        "options": {
            "delay": 1200,
            "presence": "composing"
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(endpoint, data=data, headers={
        "Content-Type": "application/json",
        "apikey": WA_API_KEY
    })
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_code = response.getcode()
            return res_code in (200, 201)
    except Exception as e:
        print(f"❌ Falha ao enviar para o grupo {group_id}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Robô de Divulgação de Vagas no WhatsApp")
    parser.add_argument('--channel', action='store_true', help="Formata a mensagem especificamente para publicação em Canal")
    parser.add_argument('--preview', action='store_true', help="Apenas imprime a mensagem formatada para conferência")
    parser.add_argument('--dry-run', action='store_true', help="Executa todo o fluxo sem realizar disparos reais")
    parser.add_argument('--limit', type=int, default=5, help="Quantidade máxima de vagas a processar (padrão: 5)")
    parser.add_argument('--force', action='store_true', help="Ignora o histórico de postagens e reenvia")
    parser.add_argument('--city', type=str, default=None, help="Filtrar por cidade (ex: Natal, Mossoró)")
    args = parser.parse_args()

    jobs = load_jobs()
    if not jobs:
        print("Nenhuma vaga encontrada.")
        return

    posted_history = load_posted_history() if not args.force else set()
    
    # Filtra vagas não postadas e ordenadas pelas mais recentes
    candidates = []
    for job in jobs:
        job_id = str(job.get('id') or job.get('slug'))
        if job_id in posted_history and not args.force:
            continue
        if args.city and args.city.lower() not in job.get('city', '').lower():
            continue
        candidates.append(job)

    print(f"\n📊 [WhatsApp Bot] Total de vagas disponíveis no sistema: {len(jobs)}")
    print(f"🎯 Vagas novas pendentes de divulgação: {len(candidates)}")

    selected = candidates[:args.limit]
    if not selected:
        print("✅ Todas as vagas atuais já foram divulgadas nos grupos do WhatsApp!")
        return

    group_list = [g.strip() for g in WA_GROUPS_RAW.split(',') if g.strip()]

    for i, job in enumerate(selected, 1):
        job_id = str(job.get('id') or job.get('slug'))
        msg = format_whatsapp_message(job, is_channel=args.channel)
        
        print("\n" + "="*50)
        print(f"📢 [{i}/{len(selected)}] Vaga: {job.get('title')} ({job.get('companyName')})")
        print("="*50)
        
        if args.preview or args.dry_run:
            print(msg)
            print("-" * 50)
            encoded = urllib.parse.quote(msg)
            print(f"🔗 Link direto para envio manual pelo WhatsApp Web/App:")
            print(f"👉 https://api.whatsapp.com/send?text={encoded}\n")
            if not args.preview:
                posted_history.add(job_id)
            continue

        if not group_list:
            print("⚠️ Nenhum WHATSAPP_GROUP_IDS configurado no ambiente.")
            print("💡 Exiba o link direto ou configure os grupos no arquivo .env:")
            encoded = urllib.parse.quote(msg)
            print(f"👉 https://api.whatsapp.com/send?text={encoded}\n")
            continue

        # Disparo real nos grupos com delay anti-ban
        for grp in group_list:
            print(f"🚀 Enviando para o grupo {grp}...")
            ok = send_whatsapp_message(grp, msg)
            if ok:
                print(f"   ✅ Mensagem entregue com sucesso no grupo {grp}!")
            else:
                print(f"   ❌ Erro no envio para o grupo {grp}.")
            time.sleep(5)  # Intervalo de segurança anti-bloqueio entre grupos

        posted_history.add(job_id)
        time.sleep(3)  # Intervalo entre vagas

    if not args.preview:
        save_posted_history(posted_history)
        print("\n✅ Processo concluído com sucesso e histórico atualizado!")

if __name__ == '__main__':
    main()
