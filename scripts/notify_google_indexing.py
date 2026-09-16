#!/usr/bin/env python3
"""
Google Indexing API Notifier — Natal Vagas
Notifica o Googlebot instantaneamente sobre novas vagas adicionadas ao catálogo,
fazendo com que sejam indexadas em minutos em vez de dias.

Requer:
- Conta de serviço no Google Cloud Console com a 'Web Search Indexing API' ativada.
- O e-mail da conta de serviço adicionado como 'Proprietário' no Google Search Console.
- Arquivo de credenciais 'service_account.json' na raiz do projeto ou variável de ambiente GOOGLE_INDEXING_KEY.
"""

import os
import sys
import json
import time
import base64
import urllib.request
import urllib.parse

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jobs_json_file = os.path.join(repo_root, "frontend", "public", "data", "jobs.json")
creds_file = os.path.join(repo_root, "service_account.json")

def get_service_account_credentials():
    # 1. Verifica arquivo local
    if os.path.exists(creds_file):
        with open(creds_file, "r", encoding="utf-8") as f:
            return json.load(f)
            
    # 2. Verifica variável de ambiente (GitHub Actions Secrets)
    env_creds = os.environ.get("GOOGLE_INDEXING_KEY")
    if env_creds:
        try:
            return json.loads(env_creds)
        except Exception:
            pass
            
    return None

def main():
    print("🛰️ Iniciando Google Indexing API Notifier...")
    
    creds = get_service_account_credentials()
    if not creds:
        print("ℹ️ Credenciais da Google Indexing API ('service_account.json' ou GOOGLE_INDEXING_KEY) não encontradas.")
        print("💡 Para ativar o aviso instantâneo ao Googlebot:")
        print("   1. Crie uma Conta de Serviço gratuita no Google Cloud Console com a Indexing API ativada.")
        print("   2. Adicione o e-mail da conta de serviço como Proprietário no Google Search Console.")
        print("   3. Salve a chave JSON como 'service_account.json' ou no Secret GOOGLE_INDEXING_KEY do GitHub.")
        print("⏩ Pulando notificação direta (o Google continuará indexando via sitemap.xml).")
        return

    if not os.path.exists(jobs_json_file):
        print(f"❌ Catálogo {jobs_json_file} não encontrado!")
        return

    with open(jobs_json_file, "r", encoding="utf-8") as f:
        jobs = json.load(f)

    # Pega as 15 vagas mais recentes
    recent_jobs = jobs[:15]
    print(f"📋 Notificando as {len(recent_jobs)} vagas mais recentes para o Googlebot...")

    # Gera JWT e solicita Access Token do Google
    try:
        import hmac
        import hashlib

        client_email = creds.get("client_email")
        private_key = creds.get("private_key")
        token_uri = creds.get("token_uri", "https://oauth2.googleapis.com/token")

        now = int(time.time())
        header = {"alg": "RS256", "typ": "JWT"}
        claim = {
            "iss": client_email,
            "scope": "https://www.googleapis.com/auth/indexing",
            "aud": token_uri,
            "exp": now + 3600,
            "iat": now
        }

        # Para assinar RS256 puro em Python sem PyJWT/cryptography instalados:
        try:
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.asymmetric import padding

            priv_key_obj = serialization.load_pem_private_key(
                private_key.encode("utf-8"),
                password=None
            )

            b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
            b64_claim = base64.urlsafe_b64encode(json.dumps(claim).encode()).decode().rstrip("=")
            signing_input = f"{b64_header}.{b64_claim}".encode()

            signature = priv_key_obj.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
            b64_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
            jwt_token = f"{b64_header}.{b64_claim}.{b64_sig}"

            # Troca JWT por Access Token
            token_data = urllib.parse.urlencode({
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": jwt_token
            }).encode()

            req = urllib.request.Request(token_uri, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            with urllib.request.urlopen(req) as res:
                auth_res = json.loads(res.read().decode())
                access_token = auth_res.get("access_token")

            # Notifica cada URL
            indexing_endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"
            success_count = 0
            for j in recent_jobs:
                slug = j.get("slug")
                if not slug:
                    continue
                job_url = f"https://natalvagas.com.br/vaga/{slug}"
                payload = json.dumps({
                    "url": job_url,
                    "type": "URL_UPDATED"
                }).encode()

                api_req = urllib.request.Request(
                    indexing_endpoint,
                    data=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {access_token}"
                    }
                )
                try:
                    with urllib.request.urlopen(api_req) as api_res:
                        if api_res.status == 200:
                            success_count += 1
                except Exception as ex:
                    print(f"⚠️ Erro ao notificar URL {job_url}: {ex}")

            print(f"✅ Sucesso! {success_count} URLs notificadas com sucesso direto na Google Indexing API!")

        except ImportError:
            print("ℹ️ Módulo 'cryptography' não disponível no ambiente para assinatura de token.")
            print("⏩ Pulando notificação direta.")

    except Exception as e:
        print(f"⚠️ Falha durante autenticação com Google Indexing API: {e}")

if __name__ == "__main__":
    main()
