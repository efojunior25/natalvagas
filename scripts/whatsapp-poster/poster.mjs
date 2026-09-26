#!/usr/bin/env node
/**
 * Robô Autônomo de Divulgação de Vagas no WhatsApp (Canal & Grupos)
 * Natal Vagas — Execução Local Headless 100% Gratuita via Puppeteer-Core
 * 
 * Uso:
 *   node scripts/whatsapp-poster/poster.mjs --login       # Abre navegador para escanear QR Code 1 vez
 *   node scripts/whatsapp-poster/poster.mjs --post        # Roda em segundo plano (invisível) e posta
 *   node scripts/whatsapp-poster/poster.mjs --post --limit 2  # Posta até 2 novas vagas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const JOBS_FILE = path.join(REPO_ROOT, 'frontend', 'public', 'data', 'jobs.json');
const HISTORY_FILE = path.join(REPO_ROOT, 'scripts', '.posted_whatsapp_jobs.json');
const SESSION_DIR = path.join(REPO_ROOT, 'scripts', '.wpp_session');
const CHANNEL_URL = 'https://web.whatsapp.com/channel/0029Vb8fAyN4o7qURPaBIN2B';

// Detecta executável do Google Chrome no Linux
function getChromePath() {
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/opt/google/chrome/chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Nenhum executável do Google Chrome ou Chromium encontrado no sistema.');
}

function loadJobs() {
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
  } catch (err) {
    console.error('❌ Erro ao ler jobs.json:', err.message);
    return [];
  }
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')));
  } catch {
    return new Set();
  }
}

function saveHistory(historySet) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(Array.from(historySet), null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Erro ao salvar histórico:', err.message);
  }
}

function formatReal(val) {
  if (!val) return '';
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatJobMessage(job) {
  const title = (job.title || 'Vaga de Emprego').trim();
  const company = (job.companyName || 'Empresa Confidencial').trim();
  const city = (job.city || 'Natal').trim();
  const neighborhood = job.neighborhood ? ` (${job.neighborhood})` : '';
  const contract = job.contractType || 'CLT';

  let salaryStr = 'Salário a combinar';
  if (!job.hideSalary && (job.salaryMin || job.salaryMax)) {
    const sMin = job.salaryMin;
    const sMax = job.salaryMax;
    if (sMin && sMax) {
      salaryStr = sMin === sMax ? formatReal(sMin) : `${formatReal(sMin)} a ${formatReal(sMax)}`;
    } else if (sMin) {
      salaryStr = `A partir de ${formatReal(sMin)}`;
    } else {
      salaryStr = `Até ${formatReal(sMax)}`;
    }
  }

  const slug = job.slug || '';
  const jobUrl = slug ? `https://natalvagas.com.br/vaga/${slug}/` : 'https://natalvagas.com.br/';

  return `🚨 *VAGA: ${title.toUpperCase()}*

🏢 ${company}
📍 ${city} - RN${neighborhood} (${contract})
💰 ${salaryStr}

👇 *Ver requisitos e enviar currículo:*
👉 ${jobUrl}`;
}

async function run() {
  const args = process.argv.slice(2);
  const isLogin = args.includes('--login');
  const isPost = args.includes('--post');
  
  let limit = 1;
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10) || 1;
  }

  if (!isLogin && !isPost) {
    console.log(`
🤖 Robô de Divulgação no WhatsApp — Natal Vagas
Uso:
  node poster.mjs --login            # Conectar conta do WhatsApp (1ª vez)
  node poster.mjs --post             # Postar vagas novas no canal
  node poster.mjs --post --limit 3   # Postar até 3 novas vagas
    `);
    process.exit(0);
  }

  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const executablePath = getChromePath();
  console.log(`🚀 Usando Chrome: ${executablePath}`);
  console.log(`📁 Perfil da sessão: ${SESSION_DIR}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: isLogin ? false : 'new',
    userDataDir: SESSION_DIR,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

  if (isLogin) {
    console.log('\n📱 Abrindo WhatsApp Web para autenticação...');
    console.log('👉 Por favor, abra o WhatsApp no celular:');
    console.log('   Configurações > Aparelhos Conectados > Conectar um aparelho');
    console.log('👉 E aponte a câmera para o QR Code na janela do Chrome que acabou de abrir!\n');
    
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Aguarda o usuário logar (detecção do chat list ou painel)
    try {
      await page.waitForSelector('div[contenteditable="true"], div[data-testid="chat-list"]', { timeout: 120000 });
      console.log('✅ Login identificado com sucesso! Sessão salva localmente.');
      console.log('🎉 Agora você já pode rodar com `--post` sem precisar abrir janela visível.');
    } catch {
      console.log('⏳ Tempo limite para escanear o QR Code expirou.');
    }
    
    await browser.close();
    process.exit(0);
  }

  if (isPost) {
    const jobs = loadJobs();
    const history = loadHistory();
    const candidates = jobs.filter(j => {
      const id = String(j.id || j.slug);
      return !history.has(id);
    });

    console.log(`📊 Total de vagas: ${jobs.length} | Novas pendentes: ${candidates.length}`);
    if (candidates.length === 0) {
      console.log('✅ Nenhuma vaga nova para publicar no momento.');
      await browser.close();
      process.exit(0);
    }

    const toPost = candidates.slice(0, limit);
    console.log(`🎯 Postando ${toPost.length} vaga(s) no canal oficial...`);

    console.log(`🌐 Navegando para o Canal Natal Vagas...`);
    await page.goto(CHANNEL_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Aguarda carregar a caixa de texto do canal
    const inputSelector = 'footer div[contenteditable="true"]';
    try {
      await page.waitForSelector(inputSelector, { timeout: 30000 });
    } catch {
      console.error('❌ Não foi possível encontrar a caixa de envio do canal. Verifique se o login está ativo rodando com `--login`.');
      await browser.close();
      process.exit(1);
    }

    for (let i = 0; i < toPost.length; i++) {
      const job = toPost[i];
      const jobId = String(job.id || job.slug);
      const msg = formatJobMessage(job);

      console.log(`\n📢 [${i + 1}/${toPost.length}] Publicando: ${job.title} (${job.companyName})...`);

      // 1. Focar e digitar o texto da vaga
      await page.focus(inputSelector);
      await page.evaluate((text, selector) => {
        const el = document.querySelector(selector);
        if (el) {
          el.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          document.execCommand('insertText', false, text);
        }
      }, msg, inputSelector);

      // 2. Aguarda 5 segundos para o WhatsApp carregar a imagem de prévia (OpenGraph)
      console.log('   ⏳ Aguardando WhatsApp gerar o card com imagem...');
      await new Promise(r => setTimeout(r, 5500));

      // 3. Localiza e clica no botão Enviar
      const sent = await page.evaluate(() => {
        const sendBtn = document.querySelector('button[aria-label="Enviar"]') ||
                        document.querySelector('footer button[data-tab="11"]') ||
                        document.querySelector('span[data-icon="wds-ic-send-filled"]')?.closest('button');
        if (sendBtn) {
          sendBtn.click();
          return true;
        }
        return false;
      });

      if (sent) {
        console.log(`   ✅ Vaga publicada com sucesso no canal!`);
        history.add(jobId);
        saveHistory(history);
      } else {
        console.error(`   ❌ Falha ao clicar no botão Enviar.`);
      }

      // Intervalo de segurança anti-bloqueio entre postagens
      if (i < toPost.length - 1) {
        console.log('   ⏸️ Aguardando intervalo de segurança (8s)...');
        await new Promise(r => setTimeout(r, 8000));
      }
    }

    console.log('\n🎉 Processo de postagem concluído!');
    await browser.close();
  }
}

run().catch(err => {
  console.error('💥 Erro fatal no robô:', err);
  process.exit(1);
});
