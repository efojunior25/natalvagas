export interface EmailEnv {
  RESEND_API_KEY?: string;
  SITE_URL?: string;
}

export function emailReady(env: EmailEnv): boolean {
  return Boolean(env.RESEND_API_KEY);
}

export async function sendAccountEmail(
  env: EmailEnv,
  message: { type: "VERIFY_EMAIL" | "RESET_PASSWORD"; to: string; url: string },
): Promise<boolean> {
  if (!emailReady(env)) return false;
  const subject = message.type === "VERIFY_EMAIL" ? "Confirme seu e-mail no Natal Vagas" : "Redefina sua senha do Natal Vagas";
  const action = message.type === "VERIFY_EMAIL" ? "Confirmar e-mail" : "Redefinir senha";
  const text = `${subject}\n\nAcesse o link para continuar: ${message.url}\n\nSe não solicitou isso, ignore esta mensagem.`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: [message.to],
      from: "Natal Vagas <noreply@natalvagas.com.br>",
      subject,
      text,
      html: `<p>${subject}</p><p><a href="${message.url}">${action}</a></p><p>Se não solicitou isso, ignore esta mensagem.</p>`,
    }),
  });
  if (!response.ok) return false;
  const result: { id?: string } = await response.json().catch(() => ({}));
  return typeof result.id === "string" && result.id.length > 0;
}
