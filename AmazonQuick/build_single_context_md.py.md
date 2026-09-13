# File: build_single_context_md.py
- **Original Path:** `scripts/build_single_context_md.py`
- **Language / Type:** `python`
- **Lines of Code:** 143

---

```python
import os
import sys

base_dir = '/home/edson-oliveira/Documentos/SaaS/Natal Vagas'
root_out_vagas = os.path.join(base_dir, 'APP_NATAL_VAGAS.md')
root_out_completo = os.path.join(base_dir, 'APP_NATAL_VAGAS_COMPLETO.md')

amazon_quick_dir = os.path.join(base_dir, 'AmazonQuick')
os.makedirs(amazon_quick_dir, exist_ok=True)
amazon_out_vagas = os.path.join(amazon_quick_dir, 'APP_NATAL_VAGAS.md')
amazon_out_completo = os.path.join(amazon_quick_dir, 'APP_NATAL_VAGAS_COMPLETO.md')

ignored_dirs = {'.git', 'node_modules', 'dist', 'target', '.tempmediaStorage', '.user_uploaded', 'AmazonQuick', 'scratch'}
ignored_exts = {'.jpg', '.jpeg', '.png', '.p12', '.class', '.jar', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'}
ignored_filenames = {'APP_NATAL_VAGAS.md', 'APP_NATAL_VAGAS_COMPLETO.md'}

ext_lang_map = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.java': 'java',
    '.py': 'python',
    '.sql': 'sql',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.xml': 'xml',
    '.txt': 'text',
    '.sh': 'bash',
    '.md': 'markdown'
}

def detect_lang(filename, ext):
    if filename == 'Dockerfile':
        return 'dockerfile'
    if filename in {'.gitignore', '.env', '.env.example', '_redirects'}:
        if filename == '.gitignore':
            return 'gitignore'
        if '.env' in filename:
            return 'bash'
        return 'text'
    return ext_lang_map.get(ext, 'text')

# Scan files
files_list = []
for root, dirs, filenames in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in ignored_dirs]
    for f in filenames:
        if f in ignored_filenames:
            continue
        ext = os.path.splitext(f)[1].lower()
        if ext not in ignored_exts and not f.endswith('.p12'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, base_dir)
            files_list.append((rel_path, full_path, f, ext))

def sort_key(item):
    rel = item[0]
    if rel == 'PROJECT_CONTEXT.md': return (0, rel)
    if rel == 'README.md': return (1, rel)
    if 'frontend/package.json' in rel: return (2, rel)
    if 'frontend/vite.config.ts' in rel: return (3, rel)
    if 'frontend/src/main.tsx' in rel: return (4, rel)
    if 'frontend/src/App.tsx' in rel: return (5, rel)
    if 'frontend/src/components/' in rel: return (6, rel)
    if 'frontend/src/pages/' in rel: return (7, rel)
    if 'frontend/functions/' in rel: return (8, rel)
    if 'frontend/src/context/' in rel: return (9, rel)
    if 'frontend/src/services/' in rel: return (10, rel)
    if 'frontend/src/types/' in rel: return (11, rel)
    if 'frontend/src/data/' in rel: return (12, rel)
    if 'frontend/public/data/' in rel: return (13, rel)
    if 'frontend/public/' in rel: return (14, rel)
    if 'frontend/' in rel: return (15, rel)
    if 'backend/' in rel: return (16, rel)
    if 'scripts/' in rel: return (17, rel)
    return (18, rel)

files_list.sort(key=sort_key)

print(f"Compilando {len(files_list)} arquivos de código em arquivo único consolidado...")

output = []
output.append("# 🚀 Natal Vagas — Código Fonte e Documentação Completa da Aplicação (All-in-One)")
output.append("> **Arquivo Único Consolidado de Código:** Contém todos os códigos-fonte, arquitetura, regras de negócio, dados, páginas, componentes, backend serverless, scripts de automação e configurações do portal [natalvagas.com.br](https://natalvagas.com.br).")
output.append(f"> **Total de Arquivos Compilados com Código Integral:** {len(files_list)} arquivos.")
output.append("\n---\n")

output.append("## 📑 Índice de Navegação do Documento\n")
for i, (rel_path, _, filename, ext) in enumerate(files_list, 1):
    anchor = rel_path.lower().replace('/', '-').replace('.', '').replace('[', '').replace(']', '').replace('_', '-')
    output.append(f"{i}. [`{rel_path}`](#{anchor})")

output.append("\n---\n")

for i, (rel_path, full_path, filename, ext) in enumerate(files_list, 1):
    anchor = rel_path.lower().replace('/', '-').replace('.', '').replace('[', '').replace(']', '').replace('_', '-')
    try:
        with open(full_path, 'r', encoding='utf-8', errors='replace') as rf:
            content = rf.read()
    except Exception as e:
        print(f"Error reading {rel_path}: {e}")
        continue

    lang = detect_lang(filename, ext)
    lines_count = len(content.splitlines())
    file_size_bytes = os.path.getsize(full_path)

    output.append(f"<a id=\"{anchor}\"></a>")
    output.append(f"## {i}. Arquivo: `{rel_path}`")
    output.append(f"- **Caminho:** `{rel_path}`")
    output.append(f"- **Nome:** `{filename}`")
    output.append(f"- **Linguagem / Sintaxe:** `{lang}`")
    output.append(f"- **Total de Linhas:** {lines_count}")
    output.append(f"- **Tamanho:** {file_size_bytes} bytes\n")

    # Determine safe fence length
    backtick_count = 3
    while '`' * backtick_count in content:
        backtick_count += 1
    fence = '`' * backtick_count

    output.append(f"{fence}{lang}")
    output.append(content)
    output.append(f"{fence}")
    output.append("\n---\n")

full_md_text = "\n".join(output)

for target_file in [root_out_vagas, root_out_completo, amazon_out_vagas, amazon_out_completo]:
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(full_md_text)

size_mb = os.path.getsize(root_out_vagas) / (1024 * 1024)
print(f"Sucesso! Gerados:")
print(f" -> {root_out_vagas}")
print(f" -> {root_out_completo}")
print(f" -> {amazon_out_vagas}")
print(f" -> {amazon_out_completo}")
print(f"Tamanho total: {size_mb:.2f} MB | {len(full_md_text.splitlines())} linhas de código.")

```
