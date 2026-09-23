# Configuração segura de acesso

## Variáveis obrigatórias

- `AUTH_SECRET`: segredo aleatório com pelo menos 32 caracteres, configurado como secret na plataforma.
- `WEBHOOK_SECRET`: segredo independente, com pelo menos 32 caracteres.
- `EDITDEV_API_KEY`: chave exclusiva da API Spring. Não reutilize os segredos anteriores.
- `CORS_ALLOWED_ORIGINS`: apenas os domínios HTTPS publicados.
- `RESEND_API_KEY`: chave com permissão apenas de envio, restrita ao domínio `natalvagas.com.br`, para verificação e recuperação de senha.
- `CLOUDFLARE_ACCOUNT_ID`: identificador da conta Cloudflare.
- Binding de serviço `EFI_PIX`: Worker privado com certificado mTLS e credenciais Efí.

O roteiro operacional atualizado está em `CONFIGURACAO_PENDENTE_EMAIL_EFI.md`.

O sistema falha fechado quando banco ou segredo não estão disponíveis. Não há valores padrão de produção.

## Perfis

- `USER`: candidato, criado pelo cadastro público.
- `COMPANY`: empresa com CNPJ, criada pelo cadastro público e inicialmente `PENDING`.
- `EDITDEV`: perfil operacional único. Não pode ser criado pelo cadastro público e exige TOTP no login.

## Provisionar EDITDEV

Defina localmente `EDITDEV_NAME`, `EDITDEV_EMAIL`, `EDITDEV_PASSWORD` e `EDITDEV_TOTP_SECRET`. A senha precisa ter no mínimo 16 caracteres; o segredo TOTP deve ser Base32 forte e cadastrado no autenticador do responsável.

Execute `node scripts/generate_editdev_seed.mjs` e aplique o SQL gerado ao D1 por um canal administrativo autenticado. O script imprime somente hash/salt, nunca a senha. Apague o arquivo SQL temporário após a aplicação.

Nunca disponibilize uma rota HTTP de bootstrap para `EDITDEV`.

## Migração

1. Faça backup do D1.
2. Aplique `frontend/migrations/0002_accounts_companies_security.sql` em homologação.
3. Provisione a conta `EDITDEV`.
4. Configure secrets e bindings.
5. Execute `audit_tmp/security_regression.mjs` e o build.
6. Só então repita em produção, com rotação dos segredos antigos.
