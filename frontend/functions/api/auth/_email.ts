export interface EmailEnv {
  RESEND_API_KEY?: string;
  SITE_URL?: string;
}

export function emailReady(env: EmailEnv): boolean {
  return Boolean(env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function accountEmailContent(type: "VERIFY_EMAIL" | "RESET_PASSWORD", url: string) {
  const verify = type === "VERIFY_EMAIL";
  const subject = verify ? "Confirme seu e-mail no Natal Vagas" : "Redefina sua senha do Natal Vagas";
  const title = verify ? "Sua jornada começa aqui." : "Vamos recuperar seu acesso.";
  const description = verify
    ? "Falta só confirmar seu endereço de e-mail para continuar usando o Natal Vagas com segurança."
    : "Recebemos uma solicitação para redefinir a senha da sua conta. Use o botão abaixo para escolher uma nova senha.";
  const action = verify ? "Confirmar meu e-mail" : "Redefinir minha senha";
  const expiration = verify ? "24 horas" : "30 minutos";
  const safeUrl = escapeHtml(url);
  const text = `${subject}\n\n${description}\n\n${action}: ${url}\n\nEste link expira em ${expiration} e só pode ser usado uma vez. Se você não solicitou esta mensagem, pode ignorá-la.\n\nNatal Vagas — https://natalvagas.com.br`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${description}</span>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;"><tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="border-top:6px solid #0284c7;border-bottom:1px solid #e2e8f0;padding:18px 20px;background:#ffffff;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="60" valign="middle" style="padding-right:12px;"><img src="https://natalvagas.com.br/assets/icone-lupa-natalvagas.png" width="54" alt="" style="display:block;width:54px;max-width:100%;height:auto;border:0;"></td>
        <td valign="middle"><img src="https://natalvagas.com.br/assets/logo-natalvagas-email.png" width="190" alt="Natal Vagas — sua oportunidade está aqui" style="display:block;width:190px;max-width:100%;height:auto;border:0;"></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:36px 32px 32px;">
      <p style="margin:0 0 12px;color:#0284c7;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">${verify ? "Confirmação de conta" : "Segurança da conta"}</p>
      <h1 style="margin:0 0 18px;color:#0f172a;font-size:28px;line-height:1.25;">${title}</h1>
      <p style="margin:0 0 28px;color:#475569;font-size:16px;line-height:1.65;">${description}</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#0284c7" style="border-radius:9px;"><a href="${safeUrl}" style="display:inline-block;padding:15px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;">${action}</a></td></tr></table>
      <p style="margin:28px 0 0;color:#475569;font-size:14px;line-height:1.6;">Este link expira em <strong>${expiration}</strong> e só pode ser usado uma vez.</p>
      <p style="margin:20px 0 8px;color:#64748b;font-size:13px;line-height:1.5;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
      <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;"><a href="${safeUrl}" style="color:#0369a1;text-decoration:underline;">${safeUrl}</a></p>
    </td></tr>
    <tr><td style="border-top:1px solid #e2e8f0;padding:22px 32px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;">Se você não solicitou esta mensagem, pode ignorá-la. Nunca compartilhe este link.<br><strong style="color:#334155;">Natal Vagas</strong> · Oportunidades no Rio Grande do Norte</td></tr>
  </table>
  <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;"><a href="https://natalvagas.com.br" style="color:#64748b;text-decoration:none;">natalvagas.com.br</a></p>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

export async function sendAccountEmail(
  env: EmailEnv,
  message: { type: "VERIFY_EMAIL" | "RESET_PASSWORD"; to: string; url: string },
): Promise<boolean> {
  if (!emailReady(env)) return false;
  const { subject, text, html } = accountEmailContent(message.type, message.url);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: [message.to],
      from: "Natal Vagas <noreply@natalvagas.com.br>",
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) return false;
  const result: { id?: string } = await response.json().catch(() => ({}));
  return typeof result.id === "string" && result.id.length > 0;
}
