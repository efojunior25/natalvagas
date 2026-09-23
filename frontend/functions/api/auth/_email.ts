export interface EmailEnv {
  CLOUDFLARE_EMAIL_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  SITE_URL?: string;
}

export function emailReady(env: EmailEnv): boolean {
  return Boolean(env.CLOUDFLARE_EMAIL_TOKEN && env.CLOUDFLARE_ACCOUNT_ID);
}

export async function sendAccountEmail(
  env: EmailEnv,
  message: { type: "VERIFY_EMAIL" | "RESET_PASSWORD"; to: string; url: string },
): Promise<boolean> {
  if (!emailReady(env)) return false;
  const subject = message.type === "VERIFY_EMAIL" ? "Confirme seu e-mail no Natal Vagas" : "Redefina sua senha do Natal Vagas";
  const action = message.type === "VERIFY_EMAIL" ? "Confirmar e-mail" : "Redefinir senha";
  const text = `${subject}\n\nAcesse o link para continuar: ${message.url}\n\nSe não solicitou isso, ignore esta mensagem.`;
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID!)}/email/sending/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: message.to,
      from: "noreply@natalvagas.com.br",
      subject,
      text,
      html: `<p>${subject}</p><p><a href="${message.url}">${action}</a></p><p>Se não solicitou isso, ignore esta mensagem.</p>`,
    }),
  });
  if (!response.ok) return false;
  const result: { success?: boolean; result?: { delivered?: string[]; queued?: string[]; permanent_bounces?: string[] } } = await response.json().catch(() => ({}));
  return result.success === true && !result.result?.permanent_bounces?.includes(message.to);
}
