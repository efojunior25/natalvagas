# Ativação de e-mail, Pix Efí e conta EDITDEV

O código do Pages está preparado. Execute as etapas abaixo na conta Cloudflare que contém o projeto `natalvagas`. Não envie senhas, tokens ou certificados pelo chat e não grave esses valores no Git.

## Faça você: roteiro em ordem

Não cole senhas, tokens, Client Secret, chave Pix ou certificado no chat ou no Git. Pare se algum menu não aparecer; diga-me em qual tela parou. Não faça uma cobrança real como teste.

### 1. Garantir que o código continue publicado

No GitHub, abra e mescle o [PR #13](https://github.com/efojunior25/natalvagas/pull/13). O código de preparação já foi publicado diretamente, mas o merge impede que um deploy automático futuro o reverta.

### 2. Receber mensagens em `dev@natalvagas.com.br`

1. Abra [Cloudflare Dashboard](https://dash.cloudflare.com/) na conta do domínio.
2. Vá a **Compute → Email Service → Email Routing → Destination Addresses**. Se seu Gmail ainda não estiver na lista como **Verified**, adicione-o e clique no link de confirmação que a Cloudflare enviará a ele.
3. No domínio `natalvagas.com.br`, abra **Email Routing → Routing Rules → Create routing rule**. Em endereço personalizado, informe `dev` (o endereço completo será `dev@natalvagas.com.br`); em ação escolha **Send to an email** e selecione seu Gmail verificado. Salve/ative.
4. Envie uma mensagem de **outra conta de e-mail** para `dev@natalvagas.com.br` e confira se chega ao Gmail, inclusive em Spam. Encaminhar e-mail não cria uma caixa postal separada nem configura o envio.

### 3. Enviar mensagens do site

1. Na Cloudflare, vá a **Compute → Email Service → Email Sending → Onboard Domain** e escolha `natalvagas.com.br`.
2. Aceite os registros DNS propostos e aguarde o domínio aparecer como verificado/ativo. Não apague os registros existentes de Email Routing. Se houver conflito DNS, pare e me mostre apenas os nomes/tipos dos registros, sem tokens.
3. Em **Workers & Pages → Plans/Billing**, confira se a conta usa **Workers Paid**. Se estiver Free, a mudança envolve cobrança recorrente; confirme preço e condições mostrados pela Cloudflare antes de ativar. O plano do domínio (Free/Pro) é separado do Workers Paid.
4. Em **My Profile → API Tokens → Create Token → Custom token**, dê um nome como `natalvagas-email-sending`; adicione a permissão **Account → Email Sending → Edit** e restrinja o recurso à conta do projeto `natalvagas`. Crie e copie o token: a Cloudflare o mostra uma vez.
5. Em **Workers & Pages → natalvagas → Settings → Variables and Secrets**, escolha **Production**, adicione `CLOUDFLARE_EMAIL_TOKEN`, cole o token como **Secret/Encrypted** (não variável visível) e salve. Se houver botão de redeploy, use-o; caso contrário, me avise para eu publicar novamente. Não envie o token pelo chat.

### 4. Preparar Efí Pix, sem ativar cobranças

1. Entre na sua conta Efí. Em **API → Aplicações**, abra a aplicação Pix existente ou use **Criar aplicação**. Habilite API Pix em **Produção** e confirme os escopos `cob.write`, `cob.read`, `payloadlocation.read` e `webhook.write`. Localize o **Client ID** e **Client Secret de Produção** (não os de Homologação).
2. Em **API → Meus Certificados → Produção → Novo Certificado**, gere e baixe o `.p12` de produção. Guarde-o em uma pasta privada fora do repositório e faça backup seguro; a Efí não permite baixar de novo o mesmo certificado.
3. Confira qual chave Pix da sua conta Efí será usada para recebimento. Guarde chave, Client ID e Client Secret em gerenciador de senhas. **Não** os insira ainda no Pages: eles serão Secrets do Worker privado que eu publicarei.
4. Quando estiver pronto, informe-me **somente o caminho absoluto local do `.p12`** (por exemplo, `C:\\Users\\seu-usuario\\Documents\\Privado\\efi-prod.p12`), sem anexar o arquivo nem copiar seu conteúdo. Combinaremos a inserção local das credenciais no Worker.

### 5. Preparar a conta EDITDEV

1. Instale um aplicativo autenticador compatível com TOTP no seu celular, se ainda não tiver.
2. Escolha uma senha única e longa para `dev@natalvagas.com.br`, guarde-a no gerenciador de senhas e **não** a envie pelo chat.
3. Ainda **não** tente cadastrar TOTP sozinho: o aplicativo autenticador precisa primeiro de um QR/segredo gerado para a conta. Eu orientarei essa etapa junto com a criação controlada da conta EDITDEV; você escaneará o QR localmente e me informará apenas se o código de 6 dígitos funciona, sem enviar o segredo.

### 6. Confirmar preços

Responda apenas **“preços confirmados”** se estiverem certos, ou liste as correções: usuário R$ 9,90/mês, R$ 39,90/ano, R$ 99,90 vitalício; empresa R$ 29,90/mês, R$ 149,90/ano, R$ 399,90 vitalício. Essa confirmação não ativa cobranças; pagamentos continuarão bloqueados até integração e testes.

Ao terminar, diga-me quais das etapas 1–6 concluiu. Pode enviar prints dos status, mas oculte credenciais, tokens e QR de autenticação.

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
