# Ativação de e-mail, Pix Efí e conta EDITDEV

O código do Pages está preparado. Execute as etapas abaixo na conta Cloudflare que contém o projeto `natalvagas`. Não envie senhas, tokens ou certificados pelo chat e não grave esses valores no Git.

## Checklist da sua parte

1. **GitHub:** mescle o [PR #13](https://github.com/efojunior25/natalvagas/pull/13) para que o próximo deploy automático não reverta a preparação já publicada.
2. **Recebimento:** crie no Cloudflare Email Routing a regra `dev@natalvagas.com.br` → seu Gmail e confirme que recebe mensagens.
3. **Envio:** ative `natalvagas.com.br` no Cloudflare Email Sending, confirme os registros DNS e o plano Workers Paid para enviar a candidatos externos. Crie um token com permissão `Email Sending: Edit` e salve-o como Secret `CLOUDFLARE_EMAIL_TOKEN` no Pages `natalvagas`, ambiente Production.
4. **Efí:** deixe disponíveis o certificado `.p12` de produção, Client ID, Client Secret e chave Pix da aplicação. Informe-me apenas o caminho local do certificado; insira as credenciais como Secrets no Cloudflare quando o Worker estiver publicado. Não envie valores pelo chat.
5. **EDITDEV:** escolha uma senha exclusiva e cadastre um segredo TOTP no seu aplicativo autenticador para `dev@natalvagas.com.br`. A senha e o segredo devem ser inseridos localmente; não envie os valores pelo chat.
6. **Preços:** confirme antes de habilitar cobranças se os planos previstos estão corretos: usuário R$ 9,90/mês, R$ 39,90/ano, R$ 99,90 vitalício; empresa R$ 29,90/mês, R$ 149,90/ano, R$ 399,90 vitalício.

## O que eu farei depois da sua configuração

Publicarei o Worker Efí, adicionarei o binding `EFI_PIX` ao Pages, registrarei e testarei o webhook, testarei envio e recuperação de e-mail, criarei a conta `EDITDEV` no D1 sem cadastro público e validarei os fluxos com dados sintéticos. O roteiro abaixo documenta os comandos para conferência; você não precisa executar a implantação do Worker nem o script de webhook sozinho.

## 1. Receber em `dev@natalvagas.com.br`

Cloudflare Dashboard → **Compute → Email Service → Email Routing → Routing Rules** → crie `dev@natalvagas.com.br` com destino no seu Gmail já verificado. Confirme no Gmail que a mensagem chega. Esse endereço servirá como identidade da conta EDITDEV; o encaminhamento não cria a conta dentro do site.

## 2. Enviar como `noreply@natalvagas.com.br`

Cloudflare Dashboard → **Compute → Email Service → Email Sending** → **Onboard Domain** → `natalvagas.com.br`. Aguarde o status verificado dos registros DNS de envio. O encaminhamento existente para seu Gmail continua separado.

O envio para candidatos externos requer **Workers Paid**. Crie um API token restrito à conta com permissão **Email Sending: Edit**. Em **Workers & Pages → natalvagas → Settings → Variables and Secrets → Production**, adicione como Secret `CLOUDFLARE_EMAIL_TOKEN`. O identificador `CLOUDFLARE_ACCOUNT_ID` já foi configurado. A aplicação enviará verificação e recuperação de senha diretamente pela API da Cloudflare. Enquanto o token não existir, o cadastro responderá 503 e não criará contas sem verificação.

Depois de salvar o token, faça um redeploy do projeto Pages para garantir que o binding seja carregado. Teste cadastro usando um endereço seu, confirme o link e teste recuperação de senha. Não use uma conta de cliente nesse primeiro teste.

## 3. Efí Pix

Na Efí, confirme a aplicação Pix de produção, os escopos `cob.write`, `cob.read`, `payloadlocation.read` e `webhook.write`, a chave Pix e o certificado `.p12` de produção. O domínio da API de produção é `pix.api.efipay.com.br`.

Cloudflare Workers requer PEM para o binding mTLS. Converta o certificado `.p12` localmente com OpenSSL para certificado e chave PEM separados. Mantenha os dois arquivos fora do repositório. Em `workers/efi-pix`, copie `wrangler.example.toml` para `wrangler.toml` e substitua apenas `REPLACE_WITH_CLOUDFLARE_CERTIFICATE_ID` pelo ID obtido com:

```powershell
npx wrangler mtls-certificate upload --cert CAMINHO_CERT_PEM --key CAMINHO_CHAVE_PEM --name natalvagas-efi-prod
```

No mesmo diretório, salve os secrets do Worker:

```powershell
npx wrangler secret put EFI_CLIENT_ID --config wrangler.toml
npx wrangler secret put EFI_CLIENT_SECRET --config wrangler.toml
npx wrangler secret put EFI_PIX_KEY --config wrangler.toml
npx wrangler deploy --config wrangler.toml
```

O Worker não tem domínio público (`workers_dev = false`). Depois de publicado, vincule ao Pages: **Workers & Pages → natalvagas → Settings → Bindings → Add → Service binding**. Nome `EFI_PIX`; serviço `natalvagas-efi-pix`; ambiente Production. Faça redeploy do Pages. Sem esse binding, `/api/payments/orders` responde 503 e não gera um QR pagável.

O Pages já tem `WEBHOOK_SECRET` como Secret, mas o valor não é recuperável. Para registrar o webhook, gere um novo segredo de 48+ caracteres, salve **o mesmo valor** como `WEBHOOK_SECRET` no Pages e coloque-o em `$env:WEBHOOK_SECRET` somente na sessão local usada pelo script. Defina também `$env:EFI_CLIENT_ID`, `$env:EFI_CLIENT_SECRET`, `$env:EFI_CERT_P12` (caminho absoluto do `.p12`), `$env:EFI_PIX_KEY` e, se necessário, `$env:EFI_CERT_PASSWORD`. Execute:

```powershell
node scripts/configure_efi_webhook.mjs
```

O script registra a URL com `?hmac=...&ignorar=` na Efí sem exibir o segredo. A Efí acrescenta `/pix` ao webhook; `ignorar=` preserva a rota. A aplicação verifica o segredo e consulta a cobrança novamente na Efí antes de ativar PRO. A chave Pix precisa ser exatamente a vinculada à aplicação Efí.

Faça primeiro uma cobrança em homologação com conta sintética e confira valor, `txid`, pagamento confirmado e duplicidade. A cobrança de produção só deve ser testada quando a configuração estiver completa.

## 4. Conta EDITDEV

Depois que `dev@natalvagas.com.br` receber e-mail, escolha uma senha forte e gere um segredo Base32 para TOTP no aplicativo autenticador. Defina localmente `EDITDEV_NAME`, `EDITDEV_EMAIL=dev@natalvagas.com.br`, `EDITDEV_PASSWORD` e `EDITDEV_TOTP_SECRET`, e execute `node scripts/generate_editdev_seed.mjs`. Aplique o SQL gerado ao D1 por `wrangler d1 execute natalvagas-db --remote --file CAMINHO_SQL`, mantendo o arquivo SQL fora do Git. A conta exige senha e código TOTP; o cadastro público não aceita o papel EDITDEV.

## Pendências funcionais separadas

- O cupom PcD e o destaque pago de vagas estão desativados na interface até que seus pedidos e regras de preço sejam integrados ao fluxo Efí.
- A primeira conta EDITDEV depende da senha e do TOTP escolhidos por você.
- O envio real e a confirmação Pix precisam de testes de ponta a ponta depois da configuração dos serviços.
