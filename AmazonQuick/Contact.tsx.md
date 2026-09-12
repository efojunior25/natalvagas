# File: Contact.tsx
- **Original Path:** `frontend/src/pages/Contact.tsx`
- **Language / Type:** `tsx`
- **Lines of Code:** 176

---

```tsx
import React, { useEffect, useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowLeft, MessageSquare, Building, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Dúvida ou Sugestão');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Fale Conosco — Natal Vagas';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    // Abre cliente de e-mail ou Gmail para envio direto
    const mailtoUrl = `mailto:contato@natalvagas.com.br?subject=${encodeURIComponent(`[${subject}] Contato de ${name}`)}&body=${encodeURIComponent(`Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${message}`)}`;
    window.open(mailtoUrl, '_blank');
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-lightBg selection:bg-brand-500 selection:text-white">
      <Navbar onOpenPostJob={() => {}} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar para as vagas
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
          <header className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-3 border border-brand-200">
              <MessageSquare className="w-3.5 h-3.5" />
              Atendimento & Parcerias
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Fale Conosco
            </h1>
            <p className="text-slate-500 mt-2">
              Dúvidas, sugestões, solicitação de anúncio ou denúncia de vaga encerrada? Fale com a equipe do Natal Vagas.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Mail className="w-5 h-5 text-brand-600 mb-2" />
                <h2 className="font-bold text-slate-900 text-sm">E-mail Direto</h2>
                <p className="text-xs text-slate-500 mt-1">Nossa caixa de entrada principal:</p>
                <a href="mailto:contato@natalvagas.com.br" className="text-xs font-semibold text-brand-600 hover:underline mt-1 block">
                  contato@natalvagas.com.br
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Building className="w-5 h-5 text-emerald-600 mb-2" />
                <h2 className="font-bold text-slate-900 text-sm">Para Empresas</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Divulgue suas vagas gratuitamente para milhares de candidatos em Natal e região.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
                <h2 className="font-bold text-slate-900 text-sm">Denunciar Vaga</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Encontrou uma vaga já preenchida ou com link quebrado? Envie o link para removermos imediatamente.
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h2 className="text-lg font-bold text-emerald-900">Mensagem Preparada com Sucesso!</h2>
                  <p className="text-sm text-emerald-800">
                    Seu programa de e-mail foi acionado com os dados preenchidos. Basta confirmar o envio para entrar em contato com nossa equipe.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Enviar Outra Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Seu Nome Completo
                    </label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Maria da Silva"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Seu E-mail
                    </label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: maria@email.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assunto
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
                    >
                      <option value="Dúvida ou Sugestão">Dúvida ou Sugestão</option>
                      <option value="Divulgação de Vaga">Quero Divulgar uma Vaga</option>
                      <option value="Denúncia de Vaga">Denunciar Vaga Expirada/Inválida</option>
                      <option value="Parceria Comercial">Parceria Comercial ou Publicidade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mensagem
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva detalhadamente sua mensagem ou informe o link da vaga em questão..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Mensagem
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

```
