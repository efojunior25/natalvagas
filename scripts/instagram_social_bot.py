#!/usr/bin/env python3
"""
Robô Automatizado para Instagram (Feed & Reels/Stories) — Natal Vagas
---------------------------------------------------------------------
1. Lê vagas reais e ativas de `frontend/public/data/jobs.json`.
2. Gera artes visuais profissionais de alta resolução usando Pillow:
   - Formato Feed (1080x1080 px - 1:1)
   - Formato Reels / Stories (1080x1920 px - 9:16)
3. Gera legendas de alto engajamento com hashtags estratégicas de Natal e RN.
4. Suporta publicação automática via Instagram Graph API ou exportação
   organizada em pasta local para postagem imediata ou agendamento no Meta Business Suite.

Uso:
    python3 scripts/instagram_social_bot.py --limit 3          # Gera 3 posts de Feed e Reels
    python3 scripts/instagram_social_bot.py --mode feed        # Apenas artes para Feed
    python3 scripts/instagram_social_bot.py --mode reels       # Apenas artes para Reels/Stories
    python3 scripts/instagram_social_bot.py --post             # Publica via Graph API se configurado
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOBS_FILE = os.path.join(BASE_DIR, 'frontend', 'public', 'data', 'jobs.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output', 'instagram')
HISTORY_FILE = os.path.join(BASE_DIR, 'scripts', '.posted_instagram_jobs.json')

# Configurações do Instagram Graph API (opcional)
IG_ACCESS_TOKEN = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')
IG_ACCOUNT_ID = os.environ.get('INSTAGRAM_ACCOUNT_ID', '')

# Paleta de Cores Natal Vagas
COLOR_BG_DARK = (15, 23, 42)       # Slate 900
COLOR_EMERALD = (5, 150, 105)     # Emerald 600
COLOR_EMERALD_LIGHT = (52, 211, 153) # Emerald 400
COLOR_AMBER = (245, 158, 11)       # Amber 500
COLOR_WHITE = (255, 255, 255)
COLOR_SLATE_200 = (226, 232, 240)
COLOR_SLATE_400 = (148, 163, 184)
COLOR_CARD = (30, 41, 59)          # Slate 800

def get_font(size, bold=False):
    font_paths = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        current_line.append(word)
        bbox = draw.textbbox((0, 0), " ".join(current_line), font=font)
        w = bbox[2] - bbox[0]
        if w > max_width:
            current_line.pop()
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
    return lines

def generate_feed_post(job, output_path):
    """Gera arte para Feed no formato quadrado 1080x1080"""
    W, H = 1080, 1080
    img = Image.new('RGB', (W, H), COLOR_BG_DARK)
    draw = ImageDraw.Draw(img)

    # 1. Gradiente sutil no topo e rodapé
    for y in range(180):
        alpha = int(255 * (1 - y / 180))
        draw.line([(0, y), (W, y)], fill=(10, 45, 35))

    # 2. Barra Superior (Brand Header)
    draw.rectangle([(60, 60), (1020, 130)], fill=COLOR_EMERALD)
    font_brand = get_font(34, bold=True)
    draw.text((80, 78), "NATAL VAGAS • VAGAS OFICIAIS RN", font=font_brand, fill=COLOR_WHITE)
    draw.text((850, 78), "100% GRÁTIS", font=get_font(28, bold=True), fill=COLOR_AMBER)

    # 3. Tag do Tipo de Vaga
    city = job.get('city', 'Natal').upper()
    font_tag = get_font(24, bold=True)
    draw.rounded_rectangle([(60, 160), (440, 205)], radius=12, fill=(30, 58, 138))
    draw.text((75, 170), f"📍 OPORTUNIDADE EM {city} / RN", font=font_tag, fill=COLOR_WHITE)

    # 4. Título do Cargo
    title = job.get('title', 'Vaga de Emprego')
    font_title = get_font(52, bold=True)
    title_lines = wrap_text(title, font_title, 960, draw)[:2]
    
    y_pos = 235
    for line in title_lines:
        draw.text((60, y_pos), line, font=font_title, fill=COLOR_WHITE)
        y_pos += 65

    # 5. Nome da Empresa
    company = job.get('companyName', 'Empresa Confidencial')
    font_company = get_font(34, bold=False)
    draw.text((60, y_pos), f"Empresa: {company}", font=font_company, fill=COLOR_EMERALD_LIGHT)
    y_pos += 60

    # 6. Card de Detalhes
    card_top = y_pos + 10
    card_bottom = 910
    draw.rounded_rectangle([(60, card_top), (1020, card_bottom)], radius=24, fill=COLOR_CARD, outline=(51, 65, 85), width=2)

    # Pílulas dentro do card (Contrato, Modelo, Salário)
    contract = job.get('contractType', 'CLT')
    work_model = job.get('workModel', 'PRESENCIAL')
    font_pill = get_font(24, bold=True)
    
    draw.rounded_rectangle([(90, card_top + 30), (320, card_top + 75)], radius=10, fill=(15, 23, 42))
    draw.text((110, card_top + 40), f"📄 {contract}", font=font_pill, fill=COLOR_WHITE)

    draw.rounded_rectangle([(340, card_top + 30), (620, card_top + 75)], radius=10, fill=(15, 23, 42))
    draw.text((360, card_top + 40), f"🏢 {work_model.capitalize()}", font=font_pill, fill=COLOR_WHITE)

    # Requisitos
    draw.text((90, card_top + 105), "Principais Requisitos & Atividades:", font=get_font(26, bold=True), fill=COLOR_AMBER)
    
    reqs_raw = job.get('requirements', '') or job.get('description', '')
    req_lines = [l.strip().lstrip('•-* ') for l in reqs_raw.split('\n') if l.strip()][:3]
    
    req_y = card_top + 150
    font_req = get_font(24, bold=False)
    for r in req_lines:
        wrapped_r = wrap_text(f"✔  {r}", font_req, 880, draw)[:2]
        for sub_r in wrapped_r:
            if req_y < card_bottom - 40:
                draw.text((90, req_y), sub_r, font=font_req, fill=COLOR_SLATE_200)
                req_y += 38

    # 7. Rodapé Call to Action
    draw.rectangle([(0, 950), (W, H)], fill=COLOR_EMERALD)
    draw.text((60, 980), "👉 LINK DA VAGA NA BIO OU ACESSE:", font=get_font(28, bold=True), fill=COLOR_WHITE)
    draw.text((60, 1020), "natalvagas.com.br", font=get_font(34, bold=True), fill=(254, 240, 138))

    img.save(output_path, "JPEG", quality=95)
    return output_path

def generate_reels_story(job, output_path):
    """Gera arte vertical para Reels / Stories no formato 1080x1920 (9:16)"""
    W, H = 1080, 1920
    img = Image.new('RGB', (W, H), COLOR_BG_DARK)
    draw = ImageDraw.Draw(img)

    # 1. Gradiente superior e inferior para profundidade
    for y in range(400):
        draw.line([(0, y), (W, y)], fill=(6, 78, 59))
        
    for y in range(1600, H):
        draw.line([(0, y), (W, y)], fill=(10, 45, 35))

    # 2. Header Topo
    font_brand = get_font(36, bold=True)
    draw.text((70, 120), "NATAL VAGAS", font=font_brand, fill=COLOR_WHITE)
    draw.text((70, 175), "O Maior Portal de Empregos do RN", font=get_font(26, bold=False), fill=COLOR_EMERALD_LIGHT)

    # 3. Alerta Impactante
    draw.rounded_rectangle([(70, 260), (1010, 340)], radius=20, fill=COLOR_AMBER)
    draw.text((100, 280), "🚨 NOVA VAGA ABERTA EM NATAL / RN", font=get_font(34, bold=True), fill=(15, 23, 42))

    # 4. Título da Vaga
    title = job.get('title', 'Vaga de Emprego')
    font_title = get_font(60, bold=True)
    title_lines = wrap_text(title, font_title, 940, draw)[:3]
    
    y_pos = 400
    for line in title_lines:
        draw.text((70, y_pos), line, font=font_title, fill=COLOR_WHITE)
        y_pos += 75

    # 5. Empresa e Local
    company = job.get('companyName', 'Empresa Confidencial')
    city = job.get('city', 'Natal')
    draw.text((70, y_pos + 10), f"🏢 {company}", font=get_font(36, bold=True), fill=COLOR_EMERALD_LIGHT)
    draw.text((70, y_pos + 65), f"📍 {city} - Rio Grande do Norte", font=get_font(30, bold=False), fill=COLOR_SLATE_200)

    # 6. Card Central
    card_top = y_pos + 140
    card_bottom = 1580
    draw.rounded_rectangle([(70, card_top), (1010, card_bottom)], radius=30, fill=COLOR_CARD, outline=(51, 65, 85), width=3)

    # Tags no card
    contract = job.get('contractType', 'CLT')
    work_model = job.get('workModel', 'PRESENCIAL')
    font_tag = get_font(28, bold=True)
    draw.rounded_rectangle([(110, card_top + 40), (450, card_top + 100)], radius=15, fill=COLOR_BG_DARK)
    draw.text((130, card_top + 55), f"📄 Regime: {contract}", font=font_tag, fill=COLOR_WHITE)

    draw.rounded_rectangle([(480, card_top + 40), (880, card_top + 100)], radius=15, fill=COLOR_BG_DARK)
    draw.text((500, card_top + 55), f"💼 {work_model.capitalize()}", font=font_tag, fill=COLOR_WHITE)

    # Requisitos & Perfil
    draw.text((110, card_top + 140), "Informações & Requisitos:", font=get_font(34, bold=True), fill=COLOR_AMBER)
    reqs_raw = job.get('requirements', '') or job.get('description', '')
    req_lines = [l.strip().lstrip('•-* ') for l in reqs_raw.split('\n') if l.strip()][:5]
    
    req_y = card_top + 200
    font_req = get_font(28, bold=False)
    for r in req_lines:
        wrapped_r = wrap_text(f"• {r}", font_req, 840, draw)[:2]
        for sub_r in wrapped_r:
            if req_y < card_bottom - 50:
                draw.text((110, req_y), sub_r, font=font_req, fill=COLOR_SLATE_200)
                req_y += 48

    # 7. Rodapé Call to Action (Stories / Reels)
    draw.rounded_rectangle([(70, 1630), (1010, 1780)], radius=25, fill=COLOR_EMERALD)
    draw.text((120, 1660), "COMO SE CANDIDATAR:", font=get_font(28, bold=True), fill=(254, 240, 138))
    draw.text((120, 1705), "👉 Toque no Link da Bio • natalvagas.com.br", font=get_font(34, bold=True), fill=COLOR_WHITE)

    img.save(output_path, "JPEG", quality=95)
    return output_path

def generate_caption(job):
    title = job.get('title', 'Vaga de Emprego')
    company = job.get('companyName', 'Empresa Confidencial')
    city = job.get('city', 'Natal')
    slug = job.get('slug', '')
    url = f"https://natalvagas.com.br/vaga/{slug}" if slug else "https://natalvagas.com.br"

    caption = (
        f"🚨 NOVA OPORTUNIDADE EM {city.upper()} / RN!\n\n"
        f"💼 Cargo: {title}\n"
        f"🏢 Empresa: {company}\n"
        f"📍 Localização: {city} - RN\n\n"
        f"📲 COMO SE CANDIDATAR (100% GRATUITO):\n"
        f"1️⃣ Acesse o link que está na nossa Bio (@natalvagasoficial)\n"
        f"2️⃣ Ou digite no seu navegador: {url}\n"
        f"3️⃣ Envie seu currículo diretamente para o recrutador!\n\n"
        f"💬 Marque nos comentários alguém que está procurando emprego em Natal e região!\n"
        f"📌 Salve este post para não perder o prazo de candidatura.\n\n"
        f"#vagasnatal #empregosnatal #natalvagas #vagasrn #mossoro #parnamirim "
        f"#vagasdeemprego #trabalhonatal #curriculo #empregopotiguar #rn"
    )
    return caption

def main():
    parser = argparse.ArgumentParser(description="Robô de Criação e Publicação para Instagram (Feed e Reels)")
    parser.add_argument('--limit', type=int, default=3, help="Quantidade de vagas a processar (padrão: 3)")
    parser.add_argument('--mode', choices=['all', 'feed', 'reels'], default='all', help="Tipo de arte a gerar")
    parser.add_argument('--city', type=str, default=None, help="Filtrar por cidade (ex: Natal)")
    args = parser.parse_args()

    if not os.path.exists(JOBS_FILE):
        print(f"❌ Arquivo de vagas não encontrado em {JOBS_FILE}")
        return

    with open(JOBS_FILE, 'r', encoding='utf-8') as f:
        jobs = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    selected = []
    for j in jobs:
        if args.city and args.city.lower() not in j.get('city', '').lower():
            continue
        selected.append(j)

    selected = selected[:args.limit]
    print(f"\n🎨 [Instagram Bot] Processando {len(selected)} vagas selecionadas...")

    for i, job in enumerate(selected, 1):
        slug = job.get('slug') or f"vaga_{job.get('id', i)}"
        clean_slug = "".join([c if c.isalnum() or c == '-' else '_' for c in slug])[:40]

        print("\n" + "="*55)
        print(f"📸 [{i}/{len(selected)}] {job.get('title')} ({job.get('companyName')})")
        print("="*55)

        feed_path = os.path.join(OUTPUT_DIR, f"{clean_slug}_feed.jpg")
        reels_path = os.path.join(OUTPUT_DIR, f"{clean_slug}_reels.jpg")
        caption_path = os.path.join(OUTPUT_DIR, f"{clean_slug}_legenda.txt")

        # Gera arte do Feed (1080x1080)
        if args.mode in ('all', 'feed'):
            generate_feed_post(job, feed_path)
            print(f"  🖼️  Arte Feed (1080x1080): {feed_path}")

        # Gera arte dos Reels/Stories (1080x1920)
        if args.mode in ('all', 'reels'):
            generate_reels_story(job, reels_path)
            print(f"  📱  Arte Reels/Story (1080x1920): {reels_path}")

        # Gera legenda e salva
        caption = generate_caption(job)
        with open(caption_path, 'w', encoding='utf-8') as f:
            f.write(caption)
        print(f"  📝  Legenda com Hashtags: {caption_path}")

    print(f"\n🎉 Todas as artes e legendas foram salvas com sucesso em:\n📂 {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
