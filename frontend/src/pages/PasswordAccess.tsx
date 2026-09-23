import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export const PasswordAccess: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (token && password !== confirmation) {
      setIsError(true);
      setMessage('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const endpoint = token ? '/api/auth/reset-password' : '/api/auth/request-password-reset';
      const body = token ? { token, password } : { email };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      setIsError(!response.ok);
      setMessage(data.message || (response.ok ? 'Solicitação concluída.' : 'Não foi possível concluir.'));
      if (response.ok && token) {
        setPassword('');
        setConfirmation('');
      }
    } catch {
      setIsError(true);
      setMessage('Não foi possível conectar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-5">
        <Link to="/" className="block w-fit mx-auto" aria-label="Voltar para Natal Vagas">
          <img src="/assets/logo-natalvagas-transparente-crop.png" alt="Natal Vagas" className="w-44 h-auto" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-black text-slate-900">{token ? 'Redefinir senha' : 'Recuperar acesso'}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {token ? 'Escolha uma nova senha para sua conta.' : 'Enviaremos um link de recuperação para seu e-mail.'}
          </p>
        </div>

        {token ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block mb-1.5 text-sm font-semibold text-slate-700">Nova senha</label>
              <input id="new-password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block mb-1.5 text-sm font-semibold text-slate-700">Confirme a nova senha</label>
              <input id="confirm-password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <p className="text-xs leading-relaxed text-slate-500">Use de 12 a 128 caracteres, com letra maiúscula, minúscula, número e símbolo.</p>
          </div>
        ) : (
          <div>
            <label htmlFor="recovery-email" className="block mb-1.5 text-sm font-semibold text-slate-700">Seu e-mail</label>
            <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="seuemail@exemplo.com" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        )}

        <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-wait">
          {submitting ? 'Aguarde...' : token ? 'Salvar nova senha' : 'Enviar instruções'}
        </button>
        {message && <p role="status" className={`text-sm ${isError ? 'text-red-700' : 'text-emerald-700'}`}>{message}</p>}
        <Link to="/" className="block text-center text-brand-600 font-bold text-sm">Voltar ao Natal Vagas</Link>
      </form>
    </main>
  );
};
