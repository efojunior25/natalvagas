# Relatório de Auditoria Pré-Publicação — Natal Vagas

**Data:** 22/09/2026  
**Revisão auditada:** `b0fab21ad226406506a8ce42385991951127c4ac` (`feat/google-analytics-gtag`)  
**Modo:** somente auditoria; nenhuma alteração no código do produto  
**Ambiente:** local, dados sintéticos e sem chamadas à produção  

## 1. Resumo executivo e veredito

## Veredito: **NÃO PRONTO**

O sistema não deve ser publicado no estado auditado. Foram confirmados controles de autenticação, pagamento e administração que falham de forma aberta quando bindings/variáveis de ambiente não existem. O impacto inclui login sem credencial válida, criação/forja de sessões, concessão gratuita de plano PRO vitalício, falsificação de confirmação Pix, criação administrativa de cupons com PIN público e publicação imediata de vagas anônimas sem moderação.

Também não estão implementados fluxos essenciais solicitados: verificação de e-mail, recuperação/redefinição/troca de senha, refresh/rotação/revogação de sessão, exclusão de conta, painel de empresa, candidaturas/favoritos/alertas, RBAC real para Usuário/Empresa/Admin e auditoria administrativa.

Pontos positivos confirmados: build de produção concluído; Flyway ativo com `ddl-auto: validate`; queries observadas usam parâmetros; busca pública limita página a 50; currículo em nuvem usa o `sub` da sessão nas queries; sitemap/robots/JSON-LD passaram nos validadores locais; nenhum `.p12`, `.pem`, `.key`, `.pfx` ou `.jks` foi encontrado rastreado no Git.

### Classificação das evidências

- **CONFIRMADO (testei e reproduzi):** execução local do handler/build/teste com request sintético, ou ausência comprovada por inventário completo de rotas/arquivos.
- **SUSPEITA (só li o código):** risco derivado da implementação, sem infraestrutura Cloudflare/PostgreSQL/Efí real disponível localmente.

## 2. Bloqueadores de publicação (must-fix)

1. **CRÍTICO — autenticação fail-open:** `/api/auth/login` aceita qualquer e-mail/senha quando D1 não está vinculado (`frontend/functions/api/auth/login.ts:77-96`). Reproduzido localmente: request sintético retornou HTTP 200, usuário e token.
2. **CRÍTICO — segredos reais/padrão versionados:** segredo HMAC, segredo de webhook, chave de admin, senhas/PINs mestres e códigos PRO estão no código/histórico. Exemplos mascarados: `nata...`, `edso...`, `poti...`. Rotacionar todos e remover do histórico.
3. **CRÍTICO — plano PRO sem pagamento:** `/api/auth/sign-pro` aceita apenas `email` e `plan`, trata como `manual_grant` e emite token aprovado (`frontend/functions/api/auth/sign-pro.ts:24-78`). Reproduzido com plano vitalício e sem txid.
4. **CRÍTICO — falsificação de Pix:** segredo padrão público autentica webhook e qualquer `payload.pix` vira aprovado sem validação criptográfica/mTLS/consulta à Efí, valor ou vínculo com pedido (`frontend/functions/api/payments/pix/webhook.ts:12,17-23,50-99`). Reproduzido localmente com Pix fictício de R$ 0,01.
5. **CRÍTICO — administração no cliente:** senhas mestras e decisão de admin/MFA ficam no bundle e em `localStorage`/`sessionStorage` (`frontend/src/context/AuthContext.tsx:40-60,209-315`; `frontend/src/pages/EditDevPage.tsx:74`). Qualquer usuário pode definir `natalvagas_admin_mfa_auth=true`; não há autorização backend correspondente para as edições locais.
6. **ALTO — publicação anônima e imediatamente aprovada:** `POST /jobs` é público (`backend/src/main/java/com/natalvagas/config/SecurityConfig.java:47-49`) e o service força `APPROVED` (`backend/src/main/java/com/natalvagas/service/JobService.java:82-117`, especialmente linha 110), contrariando a mensagem de curadoria.
7. **ALTO — códigos/cupons inseguros:** códigos PRO fixos públicos dão acesso; qualquer `PCD-XXXX` é aceito na ausência de KV; PINs administrativos públicos criam/listam cupons (`frontend/functions/api/payments/verify-code.ts:12-18,64-109`; `frontend/functions/api/coupons/verify.ts:134-145`; `frontend/functions/api/coupons/create.ts:20-39,54-68`). Todos foram reproduzidos localmente.
8. **ALTO — sessão fraca e não revogável:** token HMAC próprio de 30 dias usa segredo público, não valida emissor/audiência, não possui refresh/rotação/jti e logout só apaga armazenamento local (`frontend/functions/api/auth/_utils.ts:74-115`; `frontend/src/context/AuthContext.tsx:402-410`). Token forjado foi aceito por `/api/auth/me`.
9. **ALTO — fluxos fundamentais ausentes:** não existem endpoints/componentes para verificação de e-mail, recuperação/redefinição/troca de senha, exclusão de conta e revogação de sessões. Inventário: somente `login`, `register`, `me` e `sign-pro` em `frontend/functions/api/auth/`.
10. **ALTO — dependências vulneráveis:** `npm audit --json` confirmou 1 vulnerabilidade alta e 3 moderadas, incluindo Vite path traversal/Windows alternate paths (`GHSA-fx2h-pf6j-xcff`) e React Router open redirect (`GHSA-wrjc-x8rr-h8h6`).

## 3. Tabela de achados

| ID | Área | Severidade | Estado | Descrição | Evidência | Impacto | Como reproduzir | Correção sugerida | Esforço |
|---|---|---:|---|---|---|---|---|---|:---:|
| AUTH-01 | Login | Crítico | **CONFIRMADO** | Login aceita credenciais arbitrárias se `env.DB` estiver ausente. | `frontend/functions/api/auth/login.ts:32-75,77-96`; `audit_tmp/audit_handlers.ts:20-28`; resposta local HTTP 200 `success:true`. | Tomada de conta lógica/falsa autenticação durante erro de configuração. | Executar o runner local; caso `arbitraryLogin`. | Falhar fechado (503) se DB/secret não existirem; validar bindings no startup/deploy. | P |
| AUTH-02 | Cadastro | Alto | **CONFIRMADO** | Cadastro sem DB devolve sucesso e token, mas não persiste usuário. | `frontend/functions/api/auth/register.ts:46-72,74-92`; runner `registrationWithoutDb` retornou 201. | Contas fantasmas e sessão não lastreada. | Runner local, caso `registrationWithoutDb`. | Exigir DB e transação bem-sucedida antes de emitir sessão. | P |
| AUTH-03 | Segredos | Crítico | **CONFIRMADO** | Segredo HMAC padrão versionado; localizado também no histórico. Valor mascarado: `nata...`. | `frontend/functions/api/auth/_utils.ts:1`; `frontend/functions/api/auth/sign-pro.ts:8`; `git log -G` localizou commits `2c86ad2`, `6ae0307`, `8481e8f`. | Qualquer pessoa com repositório/bundle pode assinar sessões/benefícios. | Criar token com segredo do código e chamar `/api/auth/me`; runner `acceptedForgedSession` retornou 200. | Rotação imediata; remover defaults; secret obrigatório; reescrever histórico; invalidar tokens atuais. | M |
| AUTH-04 | Sessão | Alto | **CONFIRMADO** | Token próprio dura 30 dias, não possui `iss`, `aud`, `jti`, refresh/rotação/revogação; comparação de assinatura não é constant-time. | `frontend/functions/api/auth/_utils.ts:77-115`; logout em `AuthContext.tsx:402-410`. | Replay prolongado; logout não invalida token roubado. | Token permanece criptograficamente válido após logout local. | Cookies `HttpOnly; Secure; SameSite`, access curto, refresh rotativo e revogação server-side; validar claims. | G |
| AUTH-05 | Armazenamento | Alto | **SUSPEITA** | Sessão e perfil ficam em `localStorage`; token PRO também. | `frontend/src/context/AuthContext.tsx:36-38,115-127,333-336,435-438`. | XSS rouba tokens; usuário altera perfil/cache. | Inspeção do código. | Migrar sessão para cookie HttpOnly e não confiar no perfil local. | M |
| AUTH-06 | Google | Crítico | **SUSPEITA** | Credential Google é apenas decodificada no cliente, sem verificar assinatura, `aud`, `iss`, exp ou nonce; string vira token local. | `frontend/src/context/AuthContext.tsx:159-200`. | Identidade Google e e-mail administrativo falsificáveis. | Inspeção do código; fluxo não possui endpoint backend de validação. | Verificar Google ID token no backend com biblioteca oficial e client ID esperado. | M |
| AUTH-07 | Senhas | Médio | **CONFIRMADO** | Política aceita 6 caracteres e aplica `trim`; PBKDF2-SHA256 usa 100 mil iterações. Não há BCrypt/Argon2. | `register.ts:23,39-43`; `_utils.ts:12-40`. | Senhas fracas; espaços significativos são removidos. | Cadastro sintético com `123456` retornou 201. | Argon2id (ou BCrypt forte), mínimo 12+, bloqueio de comuns e medidor no cliente. | M |
| AUTH-08 | Enumeração | Médio | **SUSPEITA** | Cadastro retorna 409 e mensagem explícita para e-mail existente; login só calcula PBKDF2 quando usuário existe, criando diferença de tempo. | `register.ts:52-61`; `login.ts:33-53`. | Enumeração de contas por mensagem/status/timing. | Requer D1 local para medir tempos. | Resposta genérica e hash dummy no caminho inexistente. | P |
| AUTH-09 | Força bruta | Alto | **CONFIRMADO** | Não há rate limit, backoff, lockout nem CAPTCHA nos handlers de login/cadastro/recuperação. | Arquivos completos `login.ts:17-119` e `register.ts:18-115`; busca global sem implementação. | Credential stuffing/brute force e abuso de cadastro. | Inventário de código/rotas. Nenhum teste de carga foi feito. | Rate limit por IP+conta, backoff, observabilidade e CAPTCHA adaptativo. | M |
| AUTH-10 | Fluxos | Alto | **CONFIRMADO** | Verificação de e-mail, esqueci/redefinir/trocar senha, refresh e excluir conta não existem. | Inventário de `frontend/functions/api/auth/`: apenas `_utils`, `login`, `me`, `register`, `sign-pro`; busca global encontrou apenas logout local. | Conta sem prova de posse, sem recuperação segura e sem direito de exclusão. | Listar arquivos/rotas e buscar termos dos fluxos. | Implementar ponta a ponta com tokens aleatórios, uso único, hash, TTL e invalidação de sessões. | G |
| AUTH-11 | Logs/erros | Médio | **SUSPEITA** | Erros internos (`err.message`) são enviados ao cliente; payload Pix completo é logado. | `register.ts:94-102`; `login.ts:98-106`; `webhook.ts:53,60,115-119`. | Vazamento de detalhes/PII/dados transacionais em resposta e logs. | Inspeção; backend gerenciado não disponível para observar logs. | Erros genéricos, IDs de correlação, logging estruturado com redaction. | P |
| AUTH-12 | MFA/Admin | Crítico | **CONFIRMADO** | Senhas mestras no bundle e TOTP gerado/verificado/armazenado no browser. Valores mascarados: `edso...`, `admi...`, `poti...`, `nata...`. | `AuthContext.tsx:40-60,229-315`; `totpService.ts:34-49,106-127`. | MFA não prova identidade no servidor; pode ser reinicializado/alterado localmente. | Definir storage local/sessão ou usar senha exposta do bundle. | Admin real no backend; WebAuthn/TOTP server-side; recovery codes; retirar todas as credenciais do cliente e rotacionar. | G |
| AUTHZ-01 | RBAC/Admin | Crítico | **CONFIRMADO** | `/editdev` confia em `sessionStorage` para autorização. | `App.tsx:556-557`; `EditDevPage.tsx:74`; `JobDetailsPage.tsx:115-123`. | Escalonamento vertical pelo console do navegador. | Definir `sessionStorage.natalvagas_admin_mfa_auth='true'` e abrir `/editdev`. | Backend deny-by-default e autorização por ação; UI apenas reflete claims. | M |
| AUTHZ-02 | Cupons admin | Crítico | **CONFIRMADO** | PINs/segredo fixos concedem administração; PIN também vai na URL e `localStorage`. Valor testado mascarado: `edso...`. | `coupons/create.ts:20-39`; `coupons/list.ts:20-38`; `AdminCoupons.tsx:15-24,70-83`. | Criação/listagem de cupons; segredo vaza em histórico, logs e referer. | Runner `hardcodedAdminPin` retornou HTTP 201. | Sessão admin forte; nunca segredo em query/localStorage; RBAC e auditoria. | M |
| AUTHZ-03 | Jobs | Alto | **CONFIRMADO** | `POST /jobs` é anônimo e service salva como `APPROVED`. | `SecurityConfig.java:40-49`; `JobService.java:81-117`; `JobController.java:46-51`. | Spam, fraude e publicação sem moderação. | Request válido anônimo alcança o método; regra e status estão explícitos. DB local indisponível impediu POST completo. | Autenticar empresa, ownership, `PENDING`, moderação e rate limit. | M |
| AUTHZ-04 | Empresa/IDOR | Alto | **CONFIRMADO** | Não há entidade empresa/owner nem endpoints de painel/candidatos; logo não existe isolamento Empresa A/B. | Schema Spring `V1__init_schema.sql:21-59`; D1 `frontend/schema.sql:6-43`; inventário de controllers/functions. | Requisitos de isolamento horizontal não implementados. | Inventário completo de modelos e rotas. | Modelar tenant/company/ownership e testes negativos por endpoint. | G |
| PAY-01 | PRO | Crítico | **CONFIRMADO** | `sign-pro` emite plano escolhido com `email` apenas, sem login/pagamento. | `sign-pro.ts:24-29,36-73`; `AuthContext.tsx:415-438`. | Qualquer visitante obtém PRO/vitalício grátis. | Runner `unsignedPurchase`: HTTP 200, `status:approved`, `plan:lifetime`. | Remover endpoint público; emitir entitlement apenas em transação idempotente após confirmação do provedor. | M |
| PAY-02 | Ativação | Crítico | **CONFIRMADO** | Códigos permanentes públicos concedem plano; `maxUses` não é aplicado. Valor testado mascarado: `POTI...`. | `verify-code.ts:12-18,51-109`. | Receita perdida e acesso vitalício irrestrito. | Runner `publicActivationCode` retornou token lifetime. | Remover/rotacionar códigos, armazenar hashes, expiração, uso atômico e vínculo à conta. | M |
| PAY-03 | Cupom | Alto | **CONFIRMADO** | Sem KV/DB, qualquer padrão `PCD-XXXX` recebe 50%. | `coupons/verify.ts:134-145`. | Fraude de desconto. | Runner `arbitraryCoupon` com `PCD-AAAA` retornou 200. | Falhar fechado; cupom persistido, aleatório, hash, uso atômico e bound à conta. | P |
| PAY-04 | Pix webhook | Crítico | **CONFIRMADO** | Segredo público (`nata...`) autentica payload arbitrário; não valida assinatura/mTLS, valor, pedido, duplicata ou status Efí. | `webhook.ts:12,17-23,50-107`; runner `forgedWebhook` retornou processedCount 1. | Pagamentos forjados e ativação indevida. | Runner com Pix sintético de R$ 0,01 e segredo do código. | Integração oficial Efí com mTLS/assinatura, allowlist, consulta server-to-server, amount/order match e idempotência. Rotacionar segredo. | G |
| PAY-05 | Planos | Alto | **SUSPEITA** | Plano é inferido por txids fixos ou prefixo; registro Pix não contém/verifica preço/plano/usuário. | `pix/status/[txid].ts:34-80`; `webhook.ts:77-99`. | Confusão de plano e atribuição de pagamento à pessoa errada. | Requer KV local integrado para fluxo completo. | Criar order server-side com amount/plan/user/status; transição atômica. | G |
| PAY-06 | Cupom concorrente | Alto | **SUSPEITA** | Read-then-update não é atômico no D1/KV. | `coupons/verify.ts:49-78,82-128`. | Duas requisições simultâneas podem consumir o mesmo cupom. | Não testado para evitar carga e por falta de bindings. | `UPDATE ... WHERE used=0` e verificar affected rows; Durable Object/transação. | M |
| INPUT-01 | Vagas/moderação | Alto | **CONFIRMADO** | Backend Spring força status `APPROVED`; função D1 aceita `isFeatured` do body e persiste JSON inteiro. | `JobService.java:110`; `functions/api/jobs/index.ts:30-56`; payload cliente em `PostJobModal.tsx:227-257`. | Mass assignment/fraude de destaque e conteúdo não moderado. | Enviar `isFeatured:true` no body da função D1; código persiste `1`. | DTO allowlist server-side, ignorar campos privilegiados, status PENDING e validação de pagamento. | M |
| INPUT-02 | Validação | Médio | **SUSPEITA** | Campos de texto extensos e `applicationTarget` não têm formato/limite; URLs de logo/source não são validadas. | `JobCreateDTO.java:21-54`; função D1 `jobs/index.ts:7-56`. | Conteúdo abusivo, payload excessivo e links maliciosos. | Inspeção. | Limites de body/campos, validadores por canal, allowlist de esquemas/domínios quando aplicável. | M |
| INPUT-03 | SQLi | Baixo | **CONFIRMADO** | Nas queries auditadas, entradas são vinculadas com `?`/Criteria API; não foi encontrada concatenação SQL controlada pelo usuário. | `login.ts:34-37`; `register.ts:53,68-71`; `resumes/index.ts:31-36,97-109`; `JobService.java:41-68`. | Controle adequado no escopo lido. | Revisão estática das queries. | Manter bind/ORM e adicionar testes de regressão. | P |
| INPUT-04 | XSS/JSON-LD | Médio | **SUSPEITA** | JSON-LD usa `dangerouslySetInnerHTML` com dados de vagas. `JSON.stringify` não escapa necessariamente sequência `</script>`. | `frontend/src/App.tsx:186-219,254-258`; dados de vaga vêm de submissões. | Fechamento de `<script>` e XSS persistente se conteúdo chegar sem sanitização. | Não injetado em runtime por falta de backend integrado. | Serializador JSON-LD seguro escapando `<`, `>`, `&`, U+2028/U+2029; CSP. | M |
| INFRA-01 | Spring Security | Médio | **CONFIRMADO** | Swagger/OpenAPI é público; chave admin tem default no código; CSRF desabilitado. | `SecurityConfig.java:31-49`; `application.yml:32-44`. | Exposição de superfície e autenticação comprometida pelo default. CSRF passa a ser crítico se cookies forem adotados sem reconfiguração. | Revisão da filter chain. | Profile de produção sem Swagger/devtools; segredo obrigatório; manter deny-by-default; CSRF conforme modelo. | P |
| INFRA-02 | CORS | Médio | **CONFIRMADO** | Funções retornam `Access-Control-Allow-Origin: *`; Spring aceita headers `*` com credenciais e inclui localhost por default. | Ex.: `login.ts:23-27,110-117`; `WebConfig.java:11-22`; `application.yml:43-44`. | APIs token-based podem ser chamadas por qualquer origem; configuração divergente e localhost em produção. | Inspecionar resposta dos handlers locais e config. | Allowlist por ambiente, `Vary: Origin`, remover localhost em produção; nunca wildcard com credenciais. | P |
| INFRA-03 | Headers/HTTPS | Médio | **CONFIRMADO** | Não existe `frontend/public/_headers` nem configuração equivalente para HSTS, CSP, nosniff, frame-ancestors e Referrer-Policy. | Inventário de `frontend/public`; somente `_routes.json` e `_redirects`. | Clickjacking e menor mitigação de XSS/MIME/referrer. | `rg --files frontend/public` não encontrou `_headers`. | Adicionar headers na hospedagem; forçar HTTPS/HSTS após validar domínio. | P |
| INFRA-04 | Erros Spring | Médio | **SUSPEITA** | `IllegalArgumentException` é lançada sem handler global; profile/flags de stack trace não são definidos. | `JobService.java:72-78,121-127`; `application.yml` completo. | Possíveis 500 e detalhes inconsistentes. | Subida completa bloqueada por ausência de PostgreSQL/Docker. | `@ControllerAdvice`, respostas RFC 9457 genéricas, desabilitar trace/message em produção. | P |
| INFRA-05 | Dependências | Alto | **CONFIRMADO** | `npm audit`: 1 alta, 3 moderadas em Vite/esbuild/React Router. | `frontend/package-lock.json`; saída local do `npm audit --json`. | Dev server pode expor arquivos/NTLM; router possui open redirect e issue SSR. | `cd frontend && npm audit --json`. | Atualizar para versões corrigidas, revisar breaking changes e reexecutar audit/build. | M |
| INFRA-06 | Banco/migrations | Baixo | **CONFIRMADO** | Spring usa Flyway e `ddl-auto: validate`, adequado. | `application.yml:11-25`; `backend/.../db/migration/V1__init_schema.sql`. | Reduz drift destrutivo. | `mvn test` compilou resources/classes. | Manter; acrescentar teste de migration em banco efêmero. | P |
| INFRA-07 | Backup | Médio | **SUSPEITA** | Não há política/script verificável de backup e restore para PostgreSQL, D1 ou KV. Export do admin cobre apenas JSON de vagas local. | Busca global por backup; `EditDevPage.tsx:134-143`. | Perda de dados e recuperação não testada. | Inventário do repositório. | Backups automáticos, retenção, criptografia e teste periódico de restore. | M |
| PRIV-01 | LGPD | Alto | **CONFIRMADO** | Política declara que não armazena currículos, mas API/schema armazenam currículo em D1; não há exclusão de conta/dados. | `PrivacyPolicy.tsx:85-102`; `frontend/schema.sql:21-32`; `resumes/index.ts:69-120`. | Informação pública incorreta e descumprimento de transparência/direitos. | Comparar texto publicado com implementação. | Corrigir política, base legal/retenção/operadores e implementar exportação/exclusão auditável. | M |
| TEST-01 | Testes | Alto | **CONFIRMADO** | Maven compilou com sucesso, porém informou `No tests to run`; frontend não possui suíte unitária/e2e. | Saída `mvn test`; `backend/src/test` ausente; `package.json:7-12`. | Regressões críticas não detectadas. | Executar `mvn test` e inventariar scripts npm. | Testes de auth/RBAC/IDOR/pagamento; Playwright com ambiente efêmero e dados sintéticos. | G |
| BUILD-01 | Build | Baixo | **CONFIRMADO** | Build frontend passou e pré-renderizou 1.699 páginas; smoke e SEO passaram. | `npm run build`; `npm run test:smoke` com `PYTHONIOENCODING=utf-8`; `scripts/verify_seo.py`. | Sinal positivo de empacotamento, não de segurança. | Comandos citados. | Manter em CI. | P |

## 4. Matriz de cobertura

### 4.1 Login e conta

| Fluxo/tela | Status | Evidência/observação |
|---|---|---|
| Cadastro | **Quebrado** | Sem verificação de e-mail; fail-open sem DB (`register.ts:46-92`). |
| Verificação de e-mail | **Não implementado** | Nenhuma rota/token/estado no schema. |
| Login e-mail/senha | **Quebrado** | Qualquer senha funciona sem DB (`login.ts:77-96`), confirmado. |
| Login Google | **Quebrado** | JWT apenas decodificado no cliente (`AuthContext.tsx:159-200`). |
| Logout | **Parcial** | Apaga localStorage/sessionStorage, mas não revoga token (`AuthContext.tsx:402-410`). |
| Sessão/access token | **Quebrado** | Segredo público, 30 dias, sem revogação/claims completos. |
| Refresh/rotação | **Não implementado** | Nenhum endpoint ou armazenamento de refresh. |
| Esqueci a senha | **Não implementado** | Sem rota/UI. |
| Redefinição de senha | **Não implementado** | Sem token/TTL/hash/uso único. |
| Troca de senha | **Não implementado** | Sem endpoint/UI. |
| Exclusão de conta | **Não implementado** | Sem endpoint/UI. |
| Rate limit/CAPTCHA | **Não implementado** | Ausente em login, cadastro e pagamentos. |
| MFA admin | **Quebrado** | Inteiramente client-side e com credenciais públicas. |

### 4.2 Painel do usuário

| Fluxo/tela | Status | Evidência/observação |
|---|---|---|
| Perfil/edição de dados | **Não implementado** | Não há rota/página/API de perfil. |
| Criador de currículo | **Parcial** | UI existe; nuvem usa sessão, mas não limita body e política contradiz armazenamento (`ResumeBuilder.tsx`; `resumes/index.ts`). |
| Upload de currículo | **Não implementado** | Não há upload/download de arquivo; apenas JSON do currículo. |
| Candidaturas | **Não implementado** | Candidatura é link/e-mail/WhatsApp externo; sem histórico. |
| Favoritos | **Não implementado** | Nenhum modelo/rota. |
| Alertas | **Parcial** | Há links de comunidade, não preferências/alertas por usuário. |
| Exclusão/LGPD | **Não implementado** | Sem exclusão/export de dados. |
| Loading/erro/vazio | **Parcial** | Home/currículo têm estados, mas sem teste e2e completo. |
| Mobile | **Parcial** | Classes responsivas presentes; não verificado visualmente em dispositivos. |

### 4.3 Painel da empresa

| Fluxo/tela | Status | Evidência/observação |
|---|---|---|
| Cadastro de empresa/CNPJ | **Não implementado** | Sem entidade empresa/CNPJ/ownership. |
| Criar vaga | **Quebrado** | Anônimo e aprovado automaticamente. |
| Editar/pausar/excluir próprias vagas | **Não implementado** | Não há endpoints de ownership; delete Spring é admin e nem há método no controller. |
| Ver candidatos próprios | **Não implementado** | Não há candidatos/candidaturas no backend. |
| Planos e Pix | **Quebrado** | Bypasses críticos confirmados. |
| Webhook idempotente/validado | **Quebrado** | Sem autenticação robusta, amount/order match ou idempotência. |
| Pagamento expirado/duplicado | **Não implementado** | KV guarda aprovação por 1 ano; sem máquina de estados. |
| Limites/moderação | **Quebrado** | Criação sem rate limit; Spring grava `APPROVED`. |

### 4.4 Painel admin

| Fluxo/tela | Status | Evidência/observação |
|---|---|---|
| Login admin/2FA | **Quebrado** | Senhas e TOTP no cliente. |
| Moderação de vagas | **Parcial** | UI local e approve Spring; publicação já nasce aprovada. |
| Moderação de empresas/usuários | **Não implementado** | Sem modelos/endpoints. |
| Banir/suspender | **Não implementado** | Sem estado/endpoint. |
| Gestão de perfis/RBAC | **Não implementado** | D1 nem possui role; Spring usa chave única de admin. |
| Métricas | **Parcial** | Contadores locais, sem telemetria/auditoria confiável. |
| Trilha de auditoria | **Não implementado** | Nenhuma tabela/evento de auditoria. |
| Proteção contra acesso indevido | **Quebrado** | Guard client-side via sessionStorage. |
| Gestão de cupons | **Quebrado** | PIN fixo público; segredo em URL/localStorage. |

### 4.5 Matriz RBAC perfil × endpoint/tela

Legenda: **OK** = comportamento coerente; **Quebrado** = acesso indevido confirmado/dedutível diretamente; **N/I** = não implementado; **N/V** = não verificado em runtime integrado.

| Endpoint/tela | Anônimo | Usuário | Empresa | Admin | Evidência |
|---|---:|---:|---:|---:|---|
| `GET /api/jobs/**` | OK | OK | OK | OK | Público em `SecurityConfig.java:41-43`. |
| `POST /api/jobs` | **Quebrado: permitido** | **Quebrado: sem ownership** | **Quebrado: sem perfil empresa** | Permitido | `SecurityConfig.java:47-49`; `JobService.java:110`. |
| `PATCH /api/jobs/{id}/approve` | Bloqueado | Bloqueado | Bloqueado | N/V | `SecurityConfig.java:45`; chave default compromete admin. |
| `DELETE /api/jobs/**` | Bloqueado | Bloqueado | Bloqueado | **Quebrado/N/I** | Regra existe (`SecurityConfig.java:46`), mas controller não implementa delete. |
| `POST /api/auth/register` | Público | Público | Público | Público | Sem perfis/roles no D1. |
| `POST /api/auth/login` | **Quebrado** | **Quebrado** | **Quebrado** | Não é auth admin real | Fail-open sem DB. |
| `GET /api/auth/me` | Bloqueado sem token | OK com token | N/I | N/I | Token forjável com secret público. |
| `GET/POST /api/resumes` | Bloqueado sem token | Parcial/owner por `sub` | N/I | Sem override | `resumes/index.ts:17-128`. |
| `POST /api/auth/sign-pro` | **Quebrado: permitido** | **Quebrado** | **Quebrado** | **Quebrado** | Email basta; confirmado. |
| `POST /api/payments/verify-code` | **Quebrado: permitido** | **Quebrado** | **Quebrado** | **Quebrado** | Código fixo público. |
| `POST /api/coupons/verify` | Público | Público | Público | Público | Fallback aceita qualquer `PCD-XXXX`. |
| `POST /api/coupons/create` | **Quebrado com PIN público** | **Quebrado** | **Quebrado** | Permitido | Confirmado com PIN mascarado `edso...`. |
| `GET /api/coupons/list` | **Quebrado com PIN público** | **Quebrado** | **Quebrado** | Permitido | `coupons/list.ts:20-50`. |
| `POST /api/payments/pix/webhook` | **Quebrado com secret público** | Idem | Idem | Idem | Webhook falso confirmado. |
| Tela `/editdev` | **Quebrado via sessionStorage** | **Quebrado** | **Quebrado** | Permitido | `EditDevPage.tsx:74`. |
| Painel empresa | N/I | N/I | N/I | N/I | Nenhuma rota/modelo. |
| Painel usuário | N/I | N/I | N/I | N/I | Apenas modal auth e currículo. |

## 5. Recomendações para depois do lançamento

Somente após os bloqueadores:

1. WebAuthn/passkeys para administradores, além de TOTP server-side.
2. Alertas de login, sessão/dispositivos e revogação individual.
3. WAF/bot management e limites de custo por rota.
4. SAST, secret scanning, dependency audit e DAST em CI; impedir deploy se bindings obrigatórios faltarem.
5. Telemetria de segurança: sucesso/falha de login, reset, alteração de papel, moderação, pagamento e download de dados, sem senha/token/PII desnecessária.
6. Testes de autorização gerados da matriz RBAC e testes de tenant/IDOR.
7. Backups com restore exercitado e RPO/RTO documentados.
8. Revisão de acessibilidade e testes móveis reais.
9. Política de retenção, DPA com provedores e canal LGPD com SLA.

## 6. Não verificado e por quê

- **Produção, domínio e headers reais:** deliberadamente não acessados, conforme regra de não testar produção.
- **Cloudflare D1/KV/Pages bindings:** não havia ambiente local/credenciais de teste. Foram testados os caminhos sem bindings, pois são parte explícita do código e revelaram fail-open.
- **PostgreSQL/API Spring ponta a ponta:** Docker não está instalado e não havia PostgreSQL efêmero configurado. O código compilou; endpoints dependentes de DB não foram chamados.
- **Efí real, certificado e mTLS:** não usados para evitar produção/dados reais; não há sandbox Efí configurado no repositório.
- **Timing de enumeração:** não medido sem D1 local; apenas mensagem/status e bifurcação de hash foram revisados.
- **Corrida de cupom/idempotência:** não disparada para respeitar a proibição de DoS e pela falta de KV/D1 local.
- **Upload/download de currículo:** recurso de arquivo não existe; somente JSON do builder foi identificado.
- **Responsividade visual/Playwright:** build estático foi validado, mas não há Playwright instalado nem suíte e2e; não foi adicionada dependência ao produto. Estados mobile permanecem não verificados visualmente.
- **OWASP Dependency-Check Java:** plugin não está configurado; Maven compilou e informou `No tests to run`. Uma análise de CVEs Java completa requer ferramenta/banco NVD apropriado.
- **Histórico Git completo de segredos:** foram verificadas extensões sensíveis e commits que introduziram marcadores conhecidos. Não foi executado scanner de entropia dedicado; portanto podem existir outros segredos não reconhecidos.
- **Backups/restore externos:** podem existir fora do repositório; nenhum artefato verificável foi fornecido.

## 7. Evidências de execução local

| Comando/cenário | Resultado |
|---|---|
| `git pull --ff-only` | Já atualizado no branch `feat/google-analytics-gtag`. |
| `mvn test` | `BUILD SUCCESS`, mas `No tests to run`. |
| `npm ci` | 165 pacotes instalados; 4 vulnerabilidades (1 alta, 3 moderadas). |
| `npm audit --json` | Confirmou advisories em Vite/esbuild/React Router. |
| `npm run build` | Sucesso; 1.699 páginas estáticas pré-renderizadas. |
| `npm run test:smoke` com `PYTHONIOENCODING=utf-8` | 1.663 vagas, sitemap e ausência de certificados rastreados validados. |
| `python ../scripts/verify_seo.py` | Sitemap (1.618 URLs), robots, ads.txt, canonical, Open Graph, JSON-LD e páginas legais passaram. |
| `audit_tmp/audit_handlers.ts` | Reproduziu 8 cenários locais: login arbitrário, cadastro sem DB, sessão forjada, PRO sem pagamento, código PRO público, cupom arbitrário, PIN admin fixo e webhook Pix forjado. |

> Nota sobre segredos: este relatório mostra somente os quatro primeiros caracteres (`nata...`, `edso...`, `poti...`, `admi...`). Todos os valores reais encontrados devem ser tratados como comprometidos, rotacionados e removidos do histórico antes de qualquer publicação.
