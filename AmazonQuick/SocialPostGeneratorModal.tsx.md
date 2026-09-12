# File: SocialPostGeneratorModal.tsx
- **Original Path:** `frontend/src/components/SocialPostGeneratorModal.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 334

---

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Instagram, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { Job } from '../types/job';

interface SocialPostGeneratorModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

type FormatType = 'feed' | 'story';

export const SocialPostGeneratorModal: React.FC<SocialPostGeneratorModalProps> = ({
  job,
  isOpen,
  onClose
}) => {
  const [format, setFormat] = useState<FormatType>('feed');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawPost = useCallback(() => {
    if (!job || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isFeed = format === 'feed';
    const width = 1080;
    const height = isFeed ? 1080 : 1920;

    canvas.width = width;
    canvas.height = height;

    // 1. Fundo com Gradiente Elegante
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0284C7'); // Brand 600
    gradient.addColorStop(0.5, '#0369A1'); // Brand 700
    gradient.addColorStop(1, '#0C4A6E'); // Brand 900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Círculos decorativos de fundo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, 320, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.85, 260, 0, Math.PI * 2);
    ctx.fill();

    // 2. Topo: Selo "VAGA DE EMPREGO"
    const topY = isFeed ? 110 : 200;
    
    // Tag "NATAL E REGIÃO / RN"
    ctx.fillStyle = '#F59E0B'; // Amber
    ctx.beginPath();
    ctx.roundRect(80, topY - 35, 340, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('• OPORTUNIDADE NO RN', 105, topY);

    // Título Superior
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px system-ui, -apple-system, sans-serif';
    ctx.fillText('NATAL VAGAS', width - 360, topY + 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText('natalvagas.com.br', width - 360, topY + 28);

    // 3. Card Central Branco
    const cardY = isFeed ? 200 : 340;
    const cardHeight = isFeed ? 680 : 1100;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(80, cardY, width - 160, cardHeight, 40);
    ctx.fill();

    // Sombra do Card
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 4. Conteúdo dentro do Card
    let contentY = cardY + 90;

    // Nome da Empresa
    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(job.companyName.toUpperCase(), 130, contentY);

    // Título da Vaga (Grande e em destaque)
    contentY += 60;
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 54px system-ui, -apple-system, sans-serif';
    
    // Quebra de linha se o título for longo
    const words = job.title.split(' ');
    let line = '';
    const maxWidth = width - 260;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), 130, contentY);
        line = words[n] + ' ';
        contentY += 65;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 130, contentY);

    // Pills de Informações (Cidade, Modelo, Salário)
    contentY += 65;
    const pills = [
      `📍 ${job.city || 'Natal'}/RN`,
      `💼 ${job.contractType || 'CLT'}`,
      `🏢 ${job.workModel === 'REMOTO' ? 'Home Office' : 'Presencial'}`
    ];

    let pillX = 130;
    pills.forEach(p => {
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(p).width;
      
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(pillX, contentY - 30, textWidth + 36, 48, 16);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.fillText(p, pillX + 18, contentY + 2);
      pillX += textWidth + 50;
    });

    // Descrição resumida
    contentY += 75;
    ctx.fillStyle = '#64748B';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    const cleanDesc = (job.description || '').replace(/\s+/g, ' ').slice(0, isFeed ? 180 : 350) + '...';
    
    // Quebra da descrição em linhas
    const descWords = cleanDesc.split(' ');
    let descLine = '';
    for (let i = 0; i < descWords.length; i++) {
      const test = descLine + descWords[i] + ' ';
      if (ctx.measureText(test).width > maxWidth && i > 0) {
        ctx.fillText(descLine.trim(), 130, contentY);
        descLine = descWords[i] + ' ';
        contentY += 36;
      } else {
        descLine = test;
      }
    }
    ctx.fillText(descLine.trim(), 130, contentY);

    // Se for Story, adiciona caixa de link
    if (!isFeed) {
      contentY += 120;
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.roundRect(130, contentY, width - 260, 260, 30);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      ctx.fillStyle = '#0284C7';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔗 CLIQUE NO LINK DO STORY', width / 2, contentY + 100);

      ctx.fillStyle = '#64748B';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText('ou acesse: natalvagas.com.br', width / 2, contentY + 160);
      ctx.textAlign = 'left';
    }

    // 5. Rodapé da Imagem
    const footerY = isFeed ? cardY + cardHeight + 70 : height - 160;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Candidaturas abertas • Acesse natalvagas.com.br', width / 2, footerY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Mais de 180 vagas em Natal e Região Metropolitana', width / 2, footerY + 40);
    ctx.textAlign = 'left';

  }, [job, format]);

  useEffect(() => {
    if (isOpen && job) {
      // Desenha com pequeno delay para garantir canvas montado
      const timer = setTimeout(() => drawPost(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, job, format, drawPost]);

  if (!isOpen || !job) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `vaga-${job.slug}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = () => {
    const caption = `🚨 VAGA ABERTA NO RN!\n\n💼 Cargo: ${job.title}\n🏢 Empresa: ${job.companyName}\n📍 Localização: ${job.city}/RN\n\n👉 Para se candidatar, acesse o link no perfil ou visite: https://natalvagas.com.br/vaga/${job.slug}\n\n#natalvagas #vagasnatal #empregosrn #natalrn #parnamirim #oportunidadern`;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 my-6">
        
        {/* Topo do Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Gerador de Arte para Instagram</h3>
              <p className="text-xs text-slate-500">Crie posts e stories prontos para divulgar e atrair candidatos.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo: Seletor de formato e Preview */}
        <div className="p-6 space-y-6">
          
          {/* Seletor de Formato */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormat('feed')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                format === 'feed'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Feed Quadrado (1:1 - 1080x1080)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('story')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                format === 'story'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Instagram className="w-4 h-4" />
              <span>Story Vertical (9:16 - 1080x1920)</span>
            </button>
          </div>

          {/* Área de Visualização do Canvas */}
          <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-slate-200">
            <canvas
              ref={canvasRef}
              className={`rounded-xl shadow-lg border border-slate-300 max-h-[360px] w-auto object-contain transition-all`}
            />
          </div>

          {/* Ações: Baixar Imagem e Copiar Legenda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 py-3 px-5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Imagem PNG ({format === 'feed' ? 'Feed' : 'Story'})</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCaption}
              className={`py-3 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                copied
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Legenda Copiada!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Copiar Legenda Pronta</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
export default SocialPostGeneratorModal;

```
