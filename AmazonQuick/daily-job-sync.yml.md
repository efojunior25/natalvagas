# File: daily-job-sync.yml
- **Original Path:** `.github/workflows/daily-job-sync.yml`
- **Language / Type:** `yaml`
- **Lines of Code:** 43

---

```yaml
name: Atualização Diária de Vagas (Natal Vagas)
on:
  schedule:
    # Executa todos os dias às 09:00 UTC (06:00 horário de Brasília / Natal)
    - cron: '0 9 * * *'
  workflow_dispatch: # Permite disparar manualmente pelo botão "Run workflow" no GitHub
permissions:
  contents: write
jobs:
  sync-jobs:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Clonar Repositório
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: 🐍 Configurar Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: 📦 Instalar Dependências Python
        run: |
          pip install requests pillow cryptography
      - name: 🤖 Rastrear Novas Vagas no RN
        run: |
          python3 scripts/daily_job_crawler.py
      - name: 🗺️ Regenerar Sitemap XML
        run: |
          python3 scripts/generate_sitemap.py
      - name: 🛡️ Teste de Integridade Pré-Build
        run: |
          python3 scripts/verify_build_integrity.py
      - name: ⚡ Configurar Node.js & Cache do Frontend
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: 🏗️ Validar Build de Produção & Pré-renderização Estática (200 OK)
        run: |
          cd frontend
          npm ci
          npm run build

```
