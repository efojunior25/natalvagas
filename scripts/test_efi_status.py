#!/usr/bin/env python3
import os
import sys
import base64
import requests

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cert_path = os.path.join(repo_root, 'certs', 'cert.pem')
key_path = os.path.join(repo_root, 'certs', 'key.pem')

env_file = os.path.join(repo_root, '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

client_id = os.environ.get('EFI_CLIENT_ID')
client_secret = os.environ.get('EFI_CLIENT_SECRET')
pix_key = os.environ.get('PIX_KEY', 'pix@natalvagas.com.br')

if not client_id or not client_secret:
    print("❌ Variáveis EFI_CLIENT_ID ou EFI_CLIENT_SECRET não definidas no ambiente ou .env.")
    sys.exit(1)

if not os.path.exists(cert_path) or not os.path.exists(key_path):
    print("❌ Certificados não encontrados na pasta certs/.")
    sys.exit(1)

auth_str = f'{client_id}:{client_secret}'
b64_auth = base64.b64encode(auth_str.encode()).decode()
cert = (cert_path, key_path)

print("🔍 1. Testando Autenticação OAuth2 com a Efí...")
try:
    res = requests.post(
        'https://pix.api.efipay.com.br/oauth/token',
        json={'grant_type': 'client_credentials'},
        headers={'Authorization': f'Basic {b64_auth}', 'Content-Type': 'application/json'},
        cert=cert,
        timeout=10
    )
    if res.status_code != 200:
        print(f"❌ Falha na autenticação: {res.status_code} - {res.text}")
        sys.exit(1)
    
    token = res.json()['access_token']
    print("   ✓ Autenticado com sucesso na API de Produção da Efí!")
except Exception as e:
    print(f"❌ Erro de conexão com a Efí: {e}")
    sys.exit(1)

print(f"\n🔍 2. Consultando Webhook da Chave Pix {pix_key}...")
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
try:
    wh_res = requests.get(f'https://pix.api.efipay.com.br/v2/webhook/{pix_key}', headers=headers, cert=cert, timeout=10)
    if wh_res.status_code == 200:
        print(f"   ✓ Webhook Ativo: {wh_res.json().get('webhookUrl')}")
    else:
        print(f"⚠️ Status Webhook: {wh_res.status_code} - {wh_res.text}")
except Exception as e:
    print(f"❌ Erro ao consultar Webhook: {e}")

print("\n🎉 Sistema Efí Bank 100% operacional para o Natal Vagas!")
