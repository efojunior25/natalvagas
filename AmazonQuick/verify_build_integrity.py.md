# File: verify_build_integrity.py
- **Original Path:** `scripts/verify_build_integrity.py`
- **Language / Type:** `python`
- **Lines of Code:** 79

---

```python
import os
import sys
import json
import xml.etree.ElementTree as ET
import subprocess

print("🔍 Iniciando verificação de integridade pré-build (Smoke Test)...")

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jobs_json_path = os.path.join(base_dir, 'frontend', 'public', 'data', 'jobs.json')
sitemap_path = os.path.join(base_dir, 'frontend', 'public', 'sitemap.xml')

# 1. Validar jobs.json
print("\n[1/3] Verificando integridade de frontend/public/data/jobs.json...")
if not os.path.exists(jobs_json_path):
    print(f"❌ ERRO: Arquivo {jobs_json_path} não encontrado!")
    sys.exit(1)

try:
    with open(jobs_json_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
    
    if not isinstance(jobs, list):
        print("❌ ERRO: jobs.json não contém uma lista de vagas!")
        sys.exit(1)
        
    print(f"   ✓ Total de vagas carregadas: {len(jobs)}")
    if len(jobs) < 500:
        print(f"❌ ERRO: Quantidade de vagas abaixo do esperado ({len(jobs)} < 500)!")
        sys.exit(1)
        
    required_fields = ['id', 'title', 'slug', 'city', 'applicationTarget']
    sample = jobs[0]
    for field in required_fields:
        if field not in sample:
            print(f"❌ ERRO: Campo obrigatório '{field}' ausente na amostra de vagas!")
            sys.exit(1)
    print("   ✓ Estrutura e campos obrigatórios validados com sucesso.")
except Exception as e:
    print(f"❌ ERRO ao processar jobs.json: {e}")
    sys.exit(1)

# 2. Validar sitemap.xml
print("\n[2/3] Verificando integridade de frontend/public/sitemap.xml...")
if not os.path.exists(sitemap_path):
    print(f"❌ ERRO: Arquivo {sitemap_path} não encontrado!")
    sys.exit(1)

try:
    tree = ET.parse(sitemap_path)
    root = tree.getroot()
    url_count = len(root)
    print(f"   ✓ Sitemap XML válido com {url_count} URLs indexadas.")
    if url_count < 500:
        print(f"❌ ERRO: Poucas URLs no sitemap ({url_count} < 500)!")
        sys.exit(1)
except Exception as e:
    print(f"❌ ERRO ao analisar sitemap.xml: {e}")
    sys.exit(1)

# 3. Auditoria de Segurança Git
print("\n[3/3] Verificando segurança do repositório Git...")
try:
    result = subprocess.run(
        ['git', 'ls-files', '*.p12', '*.key'],
        cwd=base_dir,
        capture_output=True,
        text=True
    )
    tracked_secrets = result.stdout.strip()
    if tracked_secrets:
        print(f"❌ ERRO CRÍTICO: Arquivo de chave/certificado rastreado no Git: {tracked_secrets}")
        sys.exit(1)
    print("   ✓ Nenhum certificado (.p12) ou chave privada rastreado no Git.")
except Exception as e:
    print(f"⚠️ Aviso ao verificar Git: {e}")

print("\n🎉 TODOS OS TESTES DE INTEGRIDADE PASSARAM COM SUCESSO! Sistema pronto para build.")
sys.exit(0)

```
