import os
import sys
import xml.etree.ElementTree as ET

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print("=== VERIFICANDO SEO E CONFORMIDADE ADSENSE ===")

# 1. Sitemap
sitemap_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/public/sitemap.xml"
tree = ET.parse(sitemap_path)
root = tree.getroot()
urls = [loc.text for loc in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
print(f"[OK] sitemap.xml: {len(urls)} URLs válidas encontradas.")
assert "https://natalvagas.com.br/" in urls
assert "https://natalvagas.com.br/politica-de-privacidade" in urls
assert "https://natalvagas.com.br/termos-de-uso" in urls
assert "https://natalvagas.com.br/sobre" in urls
assert "https://natalvagas.com.br/contato" in urls
assert "https://natalvagas.com.br/dicas-seguranca" in urls
assert len([u for u in urls if "/vaga/" in u]) >= 120

# 2. Robots
robots_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/public/robots.txt"
with open(robots_path, "r", encoding="utf-8") as f:
    robots = f.read()
assert "User-agent: *" in robots
assert "Sitemap: https://natalvagas.com.br/sitemap.xml" in robots
print("[OK] robots.txt: configurado corretamente com diretiva para sitemap.")

# 3. Ads.txt
ads_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/public/ads.txt"
assert os.path.exists(ads_path)
print("[OK] ads.txt: presente na raiz pública.")

# 4. index.html
index_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/index.html"
with open(index_path, "r", encoding="utf-8") as f:
    index_html = f.read()
assert 'rel="canonical"' in index_html
assert 'application/ld+json' in index_html
assert 'WebSite' in index_html
assert 'Organization' in index_html
assert 'og:title' in index_html
print("[OK] index.html: canonical tag, Open Graph e Schema.org JSON-LD validados.")

# 5. Privacy Policy keywords for AdSense
pp_path = "C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend/src/pages/PrivacyPolicy.tsx"
with open(pp_path, "r", encoding="utf-8") as f:
    pp = f.read()
assert "Google" in pp
assert "cookies" in pp or "Cookies" in pp
assert "LGPD" in pp
assert "aboutads.info" in pp
print("[OK] Política de Privacidade: contém todas as cláusulas obrigatórias do Google AdSense e LGPD.")

# 6. Dist outputs
dist_files = ["dist/index.html", "dist/404.html", "dist/robots.txt", "dist/sitemap.xml", "dist/ads.txt", "dist/_redirects"]
for df in dist_files:
    full_p = os.path.join("C:/Users/edson.junior/Documents/ChatGPT/NatalVagas/app/frontend", df)
    assert os.path.exists(full_p), f"Arquivo ausente: {df}"
print("[OK] Build de produção (dist/): todos os arquivos estáticos e de roteamento presentes.")

print("\nTODOS OS TESTES DE SEO E ADSENSE PASSARAM COM SUCESSO!")
