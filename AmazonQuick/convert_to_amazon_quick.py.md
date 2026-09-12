# File: convert_to_amazon_quick.py
- **Original Path:** `scripts/convert_to_amazon_quick.py`
- **Language / Type:** `python`
- **Lines of Code:** 110

---

````python
import os
import sys

base_dir = '/home/edson-oliveira/Documentos/SaaS/Natal Vagas'
target_dir = os.path.join(base_dir, 'AmazonQuick')
os.makedirs(target_dir, exist_ok=True)

ignored_dirs = {'.git', 'node_modules', 'dist', 'target', '.tempmediaStorage', '.user_uploaded', 'AmazonQuick', 'scratch'}
ignored_exts = {'.jpg', '.jpeg', '.png', '.p12', '.class', '.jar', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'}

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
    '.sh': 'bash'
}

files_to_convert = []

for root, dirs, filenames in os.walk(base_dir):
    dirs[:] = [d for d in dirs if d not in ignored_dirs]
    for f in filenames:
        ext = os.path.splitext(f)[1].lower()
        if ext not in ignored_exts and not f.endswith('.p12'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, base_dir)
            files_to_convert.append((rel_path, full_path, f, ext))

files_to_convert.sort(key=lambda x: x[0])

print(f"Starting conversion of {len(files_to_convert)} files...")

converted_count = 0
index_entries = []

for rel_path, full_path, filename, ext in files_to_convert:
    # Determine clean output filename
    if filename.startswith('.'):
        out_name = filename.lstrip('.') + '.md'
    elif filename.startswith('_'):
        out_name = filename.lstrip('_') + '.md'
    elif filename == '[txid].ts':
        out_name = 'pix_status_[txid].ts.md'
    elif filename.endswith('.md'):
        out_name = filename
    else:
        out_name = filename + '.md'

    out_path = os.path.join(target_dir, out_name)

    try:
        with open(full_path, 'r', encoding='utf-8', errors='replace') as rf:
            content = rf.read()
    except Exception as e:
        print(f"Error reading {rel_path}: {e}")
        continue

    lang = ext_lang_map.get(ext, 'text')
    
    # If already markdown, prepend header metadata
    if ext == '.md':
        md_output = f"# {filename}\n> **Original Path in Project:** `{rel_path}`\n\n---\n\n{content}\n"
    else:
        # Determine fence length to avoid collisions with internal backticks
        fence = '````' if '```' in content else '```'
        md_output = f"# File: {filename}\n- **Original Path:** `{rel_path}`\n- **Language / Type:** `{lang}`\n- **Lines of Code:** {len(content.splitlines())}\n\n---\n\n{fence}{lang}\n{content}\n{fence}\n"

    with open(out_path, 'w', encoding='utf-8') as wf:
        wf.write(md_output)

    converted_count += 1
    index_entries.append((out_name, rel_path, len(content.splitlines()), ext))

# Create 00_INDEX.md
index_content = """# 📚 AmazonQuick Project Index — Natal Vagas

Este diretório contém todos os arquivos de código, configurações, dados e scripts do projeto **Natal Vagas** convertidos em formato **Markdown (.md)** individualmente em nível único (sem subpastas), ideal para indexação no **Amazon Q / AWS / NotebookLM / LLM Context**.

---

## Tabela de Arquivos Convertidos

| Arquivo Markdown | Caminho Original no Projeto | Linhas | Tipo |
| :--- | :--- | :--- | :--- |
"""

for out_name, rel_path, lines, ext in index_entries:
    file_type = ext if ext else "config"
    index_content += f"| [{out_name}](./{out_name}) | `{rel_path}` | {lines} | `{file_type}` |\n"

index_content += f"""
---
**Total de Arquivos:** {converted_count} arquivos convertidos com sucesso.
"""

with open(os.path.join(target_dir, '00_INDEX.md'), 'w', encoding='utf-8') as f:
    f.write(index_content)

print(f"Successfully converted {converted_count} files into {target_dir} plus 00_INDEX.md!")

````
