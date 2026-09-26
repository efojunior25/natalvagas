#!/usr/bin/env python3
"""
AI Job Curator — Natal Vagas (Google Gemini Free Tier)
Módulo de curadoria e higienização inteligente com IA para vagas de emprego no RN.
Configurado para respeitar rigorosamente os limites gratuitos do Google AI Studio (15 RPM / 1.500 RPD).
"""

import os
import json
import time
import urllib.request
import urllib.error
import re

import urllib.parse

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file = os.path.join(repo_root, ".env")

def get_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key and os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    key = line.strip().split("=", 1)[1].strip()
    return key

KNOWN_COMPANY_DOMAINS = {
    "riachuelo": "riachuelo.com.br",
    "teleperformance": "teleperformance.com",
    "carrefour": "carrefour.com.br",
    "atacadão": "atacadao.com.br",
    "atacadao": "atacadao.com.br",
    "assaí": "assai.com.br",
    "assai": "assai.com.br",
    "solar coca-cola": "solarcocacola.com.br",
    "solar": "solarcocacola.com.br",
    "pague menos": "paguemenos.com.br",
    "drogasil": "drogasil.com.br",
    "leroy merlin": "leroymerlin.com.br",
    "nordestão": "nordestao.com.br",
    "nordestao": "nordestao.com.br",
    "redemais": "redemaisrn.com.br",
    "rede mais": "redemaisrn.com.br",
    "hapvida": "hapvida.com.br",
    "unimed": "unimednatal.com.br",
    "unimed natal": "unimednatal.com.br",
    "miranda": "miranda.com.br",
    "miranda computação": "miranda.com.br",
    "totvs": "totvs.com",
    "ambev": "ambev.com.br",
    "magalu": "magazineluiza.com.br",
    "magazine luiza": "magazineluiza.com.br",
    "neoenergia": "neoenergia.com",
    "neoenergia cosern": "neoenergia.com",
    "cosern": "neoenergia.com",
    "senai": "rn.senai.br",
    "sesi": "rn.sesi.org.br",
    "fecomercio": "fecomerciorn.com.br",
    "sebrae": "sebrae.com.br",
    "boticário": "grupoboticario.com.br",
    "o boticário": "grupoboticario.com.br",
    "cacau show": "cacaushow.com.br",
    "renner": "lojasrenner.com.br",
    "c&a": "cea.com.br",
    "cea": "cea.com.br",
    "natura": "natura.com.br",
    "burger king": "burgerking.com.br",
    "mcdonald's": "mcdonalds.com.br",
    "mcdonalds": "mcdonalds.com.br",
    "habib's": "habibs.com.br",
    "habibs": "habibs.com.br",
    "grau técnico": "grautecnico.com.br",
    "grau tecnico": "grautecnico.com.br",
    "loucos por coxinha": "loucosporcoxinha.com.br",
    "esig": "esig.com.br",
    "esig software": "esig.com.br",
    "polimix": "polimix.com.br",
    "polimix concreto": "polimix.com.br",
    "golden tulip": "goldentulip.com",
    "divino fogão": "divinofogao.com.br",
    "divino fogao": "divinofogao.com.br",
    "nacional vw": "nacionalvw.com.br",
    "frango no pote": "frangonopote.com.br",
    "segantini": "segantiniconsultoria.com",
    "segantini consultoria": "segantiniconsultoria.com",
    "claro": "claro.com.br",
    "vivo": "vivo.com.br",
    "tim": "tim.com.br",
    "brisanet": "brisanet.com.br",
    "tcm": "tcmtelecom.com.br",
    "cabo telecom": "cabotelecom.com.br",
    "alares": "alaresinternet.com.br",
    "senac": "rn.senac.br",
    "smart fit": "smartfit.com.br"
}

def resolve_company_logo(company_name: str, domain: str = None) -> str:
    cleaned = company_name.strip()
    norm = cleaned.lower()
    
    # 1. Checa dicionário de marcas conhecidas
    for k, v in KNOWN_COMPANY_DOMAINS.items():
        if k in norm:
            return f"https://www.google.com/s2/favicons?domain={v}&sz=128"
            
    # 2. Se domínio foi identificado pela IA ou metadados
    if domain and "." in domain and not any(ign in domain for ign in ["google", "facebook", "globo"]):
        clean_dom = domain.replace("https://", "").replace("http://", "").split("/")[0].strip()
        return f"https://www.google.com/s2/favicons?domain={clean_dom}&sz=128"
        
    # 3. Fallback visual elegante UI-Avatars com cor padrão da marca (Emerald)
    encoded = urllib.parse.quote(cleaned or "NV")
    return f"https://ui-avatars.com/api/?name={encoded}&background=059669&color=fff&size=128&bold=true"

SYSTEM_INSTRUCTION = """
Você é o Curador Especialista de RH e QA do portal Natal Vagas (Rio Grande do Norte).
Sua missão é ler oportunidades de trabalho e convertê-las em JSON estruturado profissional.

DIRETRIZES:
1. DESCARTE: Se for notícia jornalística de economia, balanço de vagas (ex: "RN cria 1.500 vagas", "queda de empregos"), artigo de opinião, edital geral ou golpe cobrando taxas de exame/curso, defina is_valid_job: false.
2. EMPRESA: Extraia o nome real da contratante. Se for confidencial ou não informada, use "Empresa Confidencial / Parceira". Nunca use termos genéricos como "Como se candidatar" ou nomes de portais de notícias como empresa.
3. TÍTULO: O cargo limpo e direto em português (ex: "Auxiliar de Almoxarifado", "Vendedor Lojista", "Atendente de Restaurante"). Sem salários ou bairros no título.
4. CIDADE: Município do RN (Natal, Parnamirim, Mossoró, Macaíba, São Gonçalo do Amarante, Caicó, Currais Novos, Ceará-Mirim, Tibau do Sul, etc.). Padrão: "Natal".
5. CANAL: EMAIL (extraia o e-mail), WHATSAPP (extraia o número) ou LINK (link oficial de inscrição).
6. REQUISITOS E BENEFÍCIOS: Organize em tópicos limpos.
7. TAGS: Identifique se aceita "Sem Experiência / 1º Emprego" e se é afirmativa para "PcD".
8. REDES & SITE DA EMPRESA: Se a oportunidade mencionar o site da empresa (ex: `empresa.com.br`) ou perfil no Instagram (ex: `@lojatal`), preencha `company_domain` e `company_instagram`.
"""

def curate_job_with_gemini(raw_text: str, max_retries: int = 3) -> dict:
    api_key = get_api_key()
    if not api_key:
        raise ValueError("Chave GEMINI_API_KEY não encontrada no .env!")

    models_to_try = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.6-flash"
    ]
    
    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "contents": [{
            "parts": [{"text": f"Analise a oportunidade abaixo e devolva o JSON estruturado:\n\n{raw_text}"}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }

    req_data = json.dumps(payload).encode("utf-8")

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        for attempt in range(1, max_retries + 1):
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "X-goog-api-key": api_key
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=25) as response:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    content_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(content_text)
                    return normalize_curated_job(parsed, raw_text)
            except urllib.error.HTTPError as err:
                err_content = err.read().decode("utf-8") if err.fp else ""
                print(f"⚠️ [{model_name}] HTTP {err.code}: {err_content[:200]}")
                if err.code in [503, 429] and attempt < max_retries:
                    backoff = attempt * 3
                    time.sleep(backoff)
                else:
                    break
            except Exception as e:
                print(f"⚠️ [{model_name}] Erro genérico: {e}")
                if attempt < max_retries:
                    time.sleep(attempt * 2)
                else:
                    break

    return {"is_valid_job": False, "error": "Falha na comunicação com a API"}

def normalize_curated_job(data: dict, raw_text: str = "") -> dict:
    if not data.get("is_valid_job"):
        return {"is_valid_job": False}

    title = data.get("title") or data.get("cargo") or "Oportunidade de Emprego"
    company = data.get("companyName") or data.get("empresa") or "Empresa Confidencial / Parceira"
    city = data.get("city") or data.get("cidade") or "Natal"
    neighborhood = data.get("neighborhood") or data.get("bairro") or ""
    
    # Modalidade
    raw_model = str(data.get("workModel") or data.get("modalidade") or "PRESENCIAL").upper()
    if "REMOTO" in raw_model or "HOME" in raw_model:
        work_model = "REMOTO"
    elif "HIBRID" in raw_model:
        work_model = "HIBRIDO"
    else:
        work_model = "PRESENCIAL"
        
    # Contrato
    raw_contract = str(data.get("contractType") or data.get("tipo_contratacao") or "CLT").upper()
    if "ESTAG" in raw_contract:
        contract_type = "ESTAGIO"
    elif "APRENDIZ" in raw_contract:
        contract_type = "JOVEM_APRENDIZ"
    elif "PJ" in raw_contract:
        contract_type = "PJ"
    elif "TEMPOR" in raw_contract:
        contract_type = "TEMPORARIO"
    else:
        contract_type = "CLT"

    # Canal e Destino de Candidatura
    canal_obj = data.get("canal_candidatura")
    if isinstance(canal_obj, dict):
        channel = canal_obj.get("tipo", "EMAIL").upper()
        target = canal_obj.get("valor", "")
    else:
        channel = str(data.get("applicationChannel") or "EMAIL").upper()
        target = str(data.get("applicationTarget") or "")

    # Fallback automático com regex se a IA não preencheu o campo de destino
    if not target and raw_text:
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
        phone_match = re.search(r'\(?84\)?\s*9?\d{4}[-\s]?\d{4}', raw_text)
        if email_match:
            target = email_match.group(0)
            channel = "EMAIL"
        elif phone_match:
            target = re.sub(r'\D', '', phone_match.group(0))
            if not target.startswith("55"):
                target = "55" + target
            channel = "WHATSAPP"

    # Requisitos & Benefícios
    reqs = data.get("requirements") or data.get("requisitos") or ""
    if isinstance(reqs, list):
        reqs = "\n".join(f"• {r}" for r in reqs)

    bens = data.get("benefits") or data.get("beneficios") or ""
    if isinstance(bens, list):
        bens = "\n".join(f"• {b}" for b in bens)

    desc = data.get("description") or data.get("descricao") or ""
    if not desc and raw_text:
        desc = raw_text.strip()

    # Domínio, Instagram e Logotipo
    domain = data.get("company_domain") or data.get("companyWebsite") or data.get("site")
    instagram = data.get("company_instagram") or data.get("instagram")
    
    # Se não veio da IA, tenta achar @instagram no texto cru
    if not instagram and raw_text:
        insta_match = re.search(r'(@[a-zA-Z0-9_\.]{3,30})', raw_text)
        if insta_match:
            instagram = insta_match.group(1)

    logo_url = resolve_company_logo(company, domain)
    website_url = f"https://{domain.replace('https://', '').replace('http://', '')}" if domain and "." in str(domain) else None

    return {
        "is_valid_job": True,
        "title": title.strip(),
        "companyName": company.strip(),
        "companyLogoUrl": logo_url,
        "companyWebsite": website_url,
        "companyInstagram": instagram.strip() if instagram else None,
        "city": city.strip(),
        "neighborhood": neighborhood.strip() if neighborhood else None,
        "workModel": work_model,
        "contractType": contract_type,
        "description": desc.strip(),
        "requirements": reqs.strip(),
        "benefits": bens.strip(),
        "applicationChannel": channel if channel in ["EMAIL", "WHATSAPP", "LINK"] else "EMAIL",
        "applicationTarget": target.strip(),
        "onlyNoExperience": bool(data.get("onlyNoExperience") or "Sem Experiência" in str(data.get("tags", []))),
        "isPcd": bool(data.get("isPcd") or data.get("pcd"))
    }

if __name__ == "__main__":
    print("🧪 Testando Curador de Vagas com Gemini AI...")
    sample = (
        "CONTRATAÇÃO URGENTE EM NATAL - ALECRIM:\n"
        "Loja de Variedades contrata Operador de Caixa para início imediato.\n"
        "Requisitos: Ensino médio, disponibilidade para escala 6x1. Não precisa experiência.\n"
        "Salário R$ 1.518,00 + Vale Transporte e Quebra de Caixa.\n"
        "Enviar currículo para rh.alecrimvagas@gmail.com colocando 'Caixa Alecrim' no assunto."
    )
    result = curate_job_with_gemini(sample)
    print("\n✅ Resposta normalizada para o Natal Vagas:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
