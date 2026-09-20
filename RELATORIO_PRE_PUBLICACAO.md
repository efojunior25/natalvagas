# Relatório de Auditoria de Prontidão para Publicação (Pre-Launch QA & AppSec)
**Projeto:** Natal Vagas  
**Data da Auditoria:** 20 de Setembro de 2026  
**Auditor:** Especialista Sênior em QA & Segurança de Aplicações (AppSec)  
**Status do Repositório:** Análise estática do código-fonte (Frontend React, Cloudflare Functions, Backend Spring Boot) e reprodução de cenários em ambiente de sandbox.

---

## 1. Resumo Executivo & Veredito

### Veredito: 🔴 **NÃO PRONTO PARA PRODUÇÃO**

O portal **Natal Vagas** possui um catálogo de vagas estruturado, interface visual moderna e estratégias agressivas de SEO e PWA. No entanto, a aplicação apresenta **vulnerabilidades críticas de segurança da informação**, **falhas de arquitetura estruturais** e **ausência total de módulos essenciais declarados no escopo de negócio** (painéis de usuário, empresa e moderação real).

Se publicado no estado atual, o portal estará exposto a:
1. **Comprometimento imediato de privilégios de Administrador:** A autenticação administrativa é realizada no código do frontend (cliente), validando senhas fracas hardcoded e permitindo bypass trivial via console do navegador (`sessionStorage`).
2. **Fraude generalizada no modelo de monetização:** Qualquer usuário pode forjar tokens de acesso PRO vitalício em segundos ou solicitar tokens assinados pelo servidor sem pagar um único centavo. Os pagamentos Pix utilizam identificadores estáticos compartilhados que liberam planos para terceiros.
3. **Execução Remota de Código no Navegador (Stored XSS):** Qualquer usuário anônimo pode cadastrar uma vaga com scripts maliciosos em campos de texto, os quais são injetados sem sanitização em tags `<script type="application/ld+json">`, executando JavaScript no navegador de candidatos e administradores.
4. **Vazamento de credenciais e certificados bancários:** Certificados de produção da Efí Bank (`.p12`, `.pem`) e segredos de API estão presentes no ambiente local do repositório.
5. **Aprovação automática de vagas anônimas no Spring Boot:** Vagas cadastradas publicamente são gravadas com status `APPROVED` direto, abrindo portas para campanhas de golpes, links maliciosos e vagas fraudulentas sem moderação prévia.
6. **Perfis de Empresa e Candidato inexistentes:** Os fluxos de painel da empresa (CNPJ, gestão de candidatos) e do candidato (perfil, candidaturas, favoritos, exclusão de conta/LGPD) não estão implementados.

---

## 2. Bloqueadores de Publicação (Must-Fix) — Ordenados por Severidade

Os itens abaixo impedem a publicação do site e devem ser corrigidos antes de qualquer exposição ao público:

1. **[CRÍTICO] Bypass de Autenticação Administrativa e Senhas Mestras no Frontend (`AuthContext.tsx`):**  
   Remover toda autenticação administrativa do lado cliente, eliminar o array de senhas `MASTER_PASSWORDS` e migrar a autenticação para um endpoint backend seguro com hash Argon2/BCrypt e MFA gerenciado no servidor.
2. **[CRÍTICO] Forjamento Trivial de Tokens PRO (`AuthContext.tsx` & `verify-code.ts` & `sign-pro.ts`):**  
   Corrigir a função `verifyProToken` para validar a assinatura criptográfica com chave secreta HMAC exclusivamente no backend. Corrigir o endpoint `/api/auth/sign-pro` para exigir confirmação obrigatória de pagamento antes da emissão do token.
3. **[CRÍTICO] Stored XSS via Injeção em JSON-LD (`JobModal.tsx` e `JobDetailsPage.tsx`):**  
   Sanitizar todos os campos de texto no cadastro de vagas e escapar caracteres HTML perigosos (`<` para `\u003c`) antes de injetar objetos em tags `<script dangerouslySetInnerHTML>`.
4. **[CRÍTICO] Certificados Efí Bank e Segredos Reais no Diretório do Projeto:**  
   Mover `producao-951802-Natal Vagas.p12`, `certs/key.pem` e chaves do `.env` para cofres de segredos (Cloudflare Secrets / HashiCorp Vault), removê-los do sistema de arquivos local e rotacionar as credenciais no Efí Bank imediatamente.
5. **[CRÍTICO] Vagas Criadas Diretamente como `APPROVED` no Spring Boot (`JobService.java`):**  
   Alterar o status inicial de criação de vagas públicas para `PENDING`, exigindo aprovação manual de moderador antes de torná-las visíveis no catálogo.
6. **[ALTO] Txids Estáticos Compartilhados no Pagamento Pix (`ProPaymentModal.tsx` & `status/[txid].ts`):**  
   Implementar cobranças dinâmicas Pix com `txid` único por transação/pedido. Txids reutilizados causam aprovação indevida para múltiplos usuários simultâneos.
7. **[ALTO] Desconexão Arquitetural entre Spring Boot e Cloudflare Functions:**  
   Definir uma fonte canônica de verdade para o backend (ou migrar os endpoints de auth/pagamento para o Spring Boot ou consolidar toda a persistência no Cloudflare D1). No modo de desenvolvimento local, o Vite encaminha requisições `/api` para a porta 8085 do Spring Boot, onde endpoints de autenticação e pagamentos não existem (resultando em fallback mock no navegador).
8. **[ALTO] Ausência de Recuperação de Senha, Verificação de E-mail e Exclusão de Conta (LGPD):**  
   Implementar envio de e-mails transacionais para confirmação de conta, recuperação de senha com tokens de uso único e rota para exclusão e portabilidade de dados pessoais.

---

## 3. Tabela de Achados de Auditoria

| ID | Área | Severidade | Confirmado / Suspeita | Descrição | Evidência | Impacto | Como Reproduzir | Correção Sugerida | Esforço |
|---|---|---|---|---|---|---|---|---|---|
| **SEC-01** | Auth / Login | **Crítico** | **CONFIRMADO** | Senhas mestras hardcoded e autenticação Admin 100% no cliente | `frontend/src/context/AuthContext.tsx:52-60` e `:143-145` | Qualquer visitante assume papel de Admin e acessa telas restritas | Abrir DevTools no navegador, executar `sessionStorage.setItem('natalvagas_admin_mfa_auth', 'true')` e acessar `/editdev` | Transferir autenticação para o backend, excluir senhas no código e usar cookies HTTP-only seguros | M |
| **SEC-02** | Monetização | **Crítico** | **CONFIRMADO** | `verifyProToken` aceita qualquer assinatura hex de 64 caracteres | `frontend/src/context/AuthContext.tsx:80-105` | Desbloqueio gratuito e permanente do Plano PRO para qualquer usuário | Gerar payload base64 com status "approved" e concatenar `.` seguido de 64 zeros; `verifyProToken` retorna `true` | Validar a assinatura HMAC-SHA256 no servidor com chave secreta não exposta ao cliente | P |
| **SEC-03** | Monetização | **Crítico** | **CONFIRMADO** | Endpoint `/api/auth/sign-pro` assina token PRO vitalício sem checar pagamento | `frontend/functions/api/auth/sign-pro.ts:27-45` | Obtenção de token PRO válido assinado pelo servidor de graça | Fazer `POST /api/auth/sign-pro` com payload `{"email": "teste@exemplo.com", "plan": "lifetime"}` (sem `txid`) | Exigir `txid` válido, confirmado no banco de pagamentos antes de gerar qualquer token | P |
| **SEC-04** | Injeção / XSS | **Crítico** | **CONFIRMADO** | Stored XSS via quebra de tag em Schema JSON-LD | `frontend/src/components/JobModal.tsx:102` e `JobDetailsPage.tsx:367` | Execução de script arbitrário no navegador de visitantes e roubo de tokens de sessão | Cadastrar vaga com título `Analista</script><script>alert(1)</script>` e abrir o modal da vaga | Escapar `<` como `\u003c` ao serializar JSON-LD em tags `<script>` | P |
| **SEC-05** | Credenciais | **Crítico** | **CONFIRMADO** | Certificado bancário `.p12`, chave privada RSA e segredos expostos no disco | Raiz `./producao-951802-Natal Vagas.p12`, `certs/key.pem`, `.env:2-6` | Comprometimento total da conta jurídica Efí Bank e falsificação de transações Pix | Inspecionar a pasta raiz do repositório local | Revogar e reemitir certificado no Efí Bank, mover arquivos para cofre seguro fora do repo | M |
| **SEC-06** | Backend / Moderação | **Crítico** | **CONFIRMADO** | Vagas criadas via API Spring Boot ficam ativas (`APPROVED`) imediatamente sem moderação | `backend/src/main/java/com/natalvagas/service/JobService.java:110` | Disseminação instantânea de fraudes e golpes de falso emprego no catálogo | Fazer `POST /jobs` com payload válido; o retorno indica `status: "APPROVED"` | Definir `status(JobStatus.PENDING)` em `JobService.java:110` e criar fila de aprovação | P |
| **SEC-07** | Auth / Login | **Alto** | **CONFIRMADO** | Fallback de contingência no login aceita qualquer senha se banco D1 estiver ausente | `frontend/functions/api/auth/login.ts:77-96` | Qualquer usuário loga com qualquer senha se D1 não responder | Enviar `POST /api/auth/login` sem D1 configurado; retorna HTTP 200 com token válido | Retornar HTTP 503 (Serviço Indisponível) caso a conexão com a base de dados falhe | P |
| **SEC-08** | Auth / Login | **Alto** | **CONFIRMADO** | Cadastro finge sucesso criando mock local caso a API falhe | `frontend/src/context/AuthContext.tsx:380-392` | Usuário acredita ter conta criada, mas dados não foram persistidos no servidor | Bloquear ou derrubar o backend e tentar se cadastrar; modal fecha com falso sucesso | Tratar erros de rede exibindo alerta ao usuário em vez de criar usuário fake em `localStorage` | P |
| **SEC-09** | Pagamentos | **Alto** | **CONFIRMADO** | Planos Pix possuem `txid` estático e compartilhado entre todos os compradores | `frontend/src/components/ProPaymentModal.tsx:45,67,91` | Um único pagamento pode validar o status de múltiplos usuários concorrentes | Abrir modal em duas abas anônimas; ambas consultam o mesmo `txid` estático | Gerar cobrança Pix dinâmica com `txid` aleatório exclusivo por pedido na Efí | G |
| **SEC-10** | Pagamentos | **Alto** | **CONFIRMADO** | Códigos autorizados fixos concedem PRO vitalício ilimitado (`verify-code.ts`) | `frontend/functions/api/payments/verify-code.ts:13-19` | Perda total de controle de cupons e acesso PRO não autorizado | Enviar código `POTIGUAR2026` no endpoint `/api/payments/verify-code`; aprova vitalício sem limite | Remover códigos fixos em código, armazenar cupons em tabela com contador e expiração | M |
| **SEC-11** | Painel Admin | **Alto** | **CONFIRMADO** | Modificações em `/editdev` gravam apenas no `localStorage` do navegador do admin | `frontend/src/pages/EditDevPage.tsx:97,129` | Alterações de vagas feitas pelo admin não são vistas por nenhum outro usuário | Alterar uma vaga em `/editdev` e abrir o site em outro navegador; a alteração não existe | Implementar endpoint backend (`PATCH /api/jobs/{id}`) para persistir edições no banco | M |
| **SEC-12** | Painel Admin | **Médio** | **CONFIRMADO** | Tela de gerenciamento de cupons (`AdminCoupons.tsx`) não possui rota e está órfã | `frontend/src/pages/AdminCoupons.tsx` e `frontend/src/App.tsx:513-547` | Administrador não tem como acessar a interface de gestão de cupons PcD | Buscar a rota `/admin/coupons` em `App.tsx`; não há correspondência | Adicionar rota protegida para `AdminCoupons` em `App.tsx` | P |
| **SEC-13** | Sessão | **Médio** | **CONFIRMADO** | Tokens JWT de 30 dias salvos em `localStorage` sem revogação no logout | `frontend/src/context/AuthContext.tsx:402-410` e `_utils.ts:84` | Sessões sequestradas continuam ativas no servidor por 30 dias após logout | Fazer logout, copiar o token anterior e enviar no cabeçalho `Authorization`; a API ainda aceita | Usar cookies `HttpOnly; Secure; SameSite=Lax` com mecanismo de lista negra ou refresh tokens | M |
| **SEC-14** | Auth / Segurança | **Médio** | **CONFIRMADO** | Inexistência de política de rate limit e proteção contra força bruta | `functions/api/auth/login.ts` e `backend/SecurityConfig.java` | Ataques automatizados de força bruta contra senhas e cupons de ativação | Disparar requisições em loop contra `/api/auth/login`; não há bloqueio ou atraso | Implementar rate limiting por IP/conta via Cloudflare WAF ou biblioteca Bucket4j/Redis | M |
| **SEC-15** | Auth / Enumeração | **Baixo** | **CONFIRMADO** | Enumeração de usuários através da resposta do cadastro | `frontend/functions/api/auth/register.ts:55-61` | Invasores podem mapear quais e-mails possuem conta no portal | Tentar registrar um e-mail já existente; a API responde HTTP 409 explícito | Manter mensagens e respostas neutras ou implementar fluxo unificado | P |
| **SEC-16** | CORS | **Médio** | **CONFIRMADO** | Wildcard permissivo (`Access-Control-Allow-Origin: *`) em todas as rotas da Edge API | `frontend/functions/api/**/*.ts` | Qualquer domínio externo pode disparar requisições AJAX contra a API | Inspecionar cabeçalhos de resposta em requisições OPTIONS | Restringir CORS explicitamente para `https://natalvagas.com.br` | P |
| **SEC-17** | Pagamento Cartão | **Médio** | **CONFIRMADO** | Opção Cartão de Crédito é um formulário sem gateway que encaminha para o WhatsApp | `frontend/src/components/ProPaymentModal.tsx:728-738` | Frustração do usuário que espera aprovação instantânea e abandono de carrinho | Clicar na aba Cartão de Crédito no modal de pagamento | Integrar gateway real de cartão (Mercado Pago / Efí) ou deixar claro que o atendimento é manual | M |
| **SEC-18** | Arquitetura | **Alto** | **CONFIRMADO** | Ambiente de desenvolvimento (Vite) aponta para Spring Boot, mas Auth/Pix estão no Cloudflare | `frontend/vite.config.ts:11-16` vs `frontend/functions/` | Quebra de paridade dev-prod: desenvolvedores testam com mocks sem saber se o backend real funciona | Rodar `npm run dev`; qualquer chamada a `/api/auth/*` retorna 404/403 do Spring Boot | Unificar a stack da API ou configurar o Wrangler Pages dev localmente | G |
| **SEC-19** | LGPD / Auth | **Alto** | **CONFIRMADO** | Inexistência de recuperação de senha, verificação de e-mail e exclusão de conta | Toda a base de código | Violação de requisitos de conformidade com LGPD e perda irreversível de acesso por usuários | Procurar funcionalidade "Esqueci minha senha" ou "Excluir conta"; inexistem | Criar rotas e serviços para envio de e-mails de redefinição e exclusão lógica/física | G |
| **SEC-20** | Qualidade / Testes | **Médio** | **CONFIRMADO** | Ausência completa de testes automatizados unitários ou de integração | Pastas `backend/src/test/` (inexistente) e `frontend/` (sem testes) | Regressões silenciosas em atualizações de código | Executar `mvn test` no backend; exibe "No sources to compile" | Adicionar suítes de teste com JUnit 5 / Mockito no backend e Vitest / Testing Library no front | G |

---

## 4. Matriz de Cobertura de Funcionalidades por Perfil

Legenda:  
- ✅ **OK**: Funcionalidade completa e segura.  
- ⚠️ **Parcial**: Funciona superficialmente, mas possui falhas de segurança, dados voláteis ou lógica incompleta.  
- ❌ **Quebrado**: Implementado, mas falha ou gera erro durante o uso.  
- ⛔ **Não Implementado**: Declarado no escopo ou documentação, mas ausente no código.  
- ❓ **Não Verificado**: Não foi possível testar (motivo detalhado na seção 6).

---

### A. Fluxos de Login e Autenticação

| Fluxo / Requisito | Status | Detalhes / Evidência |
|---|---|---|
| Cadastro de Usuário (Email/Senha) | ⚠️ **Parcial** | Salva no Cloudflare D1 se configurado. Se falhar, cria mock em `localStorage` (`AuthContext.tsx:380`). |
| Validação de Força de Senha | ❌ **Quebrado** | Exige apenas 6 caracteres (`register.ts:39`), sem exigência de complexidade (maiúsculas, números, caracteres especiais). |
| Verificação de E-mail (Confirmação) | ⛔ **Não Implementado** | Não há envio de e-mail com token ou link de ativação; conta fica ativa imediatamente. |
| Login com E-mail e Senha | ⚠️ **Parcial** | Funciona no D1. Porém, há fallback que aceita qualquer senha se o banco não estiver ativo (`login.ts:77`). |
| Login Social com Google | ⚠️ **Parcial** | Decodifica token JWT do Google no frontend (`AuthContext.tsx:168`), mas não valida assinatura no backend. |
| Proteção contra Força Bruta / Rate Limit | ⛔ **Não Implementado** | Sem CAPTCHA, sem limite de tentativas por IP ou bloqueio temporário de conta. |
| "Esqueci a Senha" / Redefinição | ⛔ **Não Implementado** | Botão e fluxos inexistentes em `AuthModal.tsx` e na API. |
| Troca de Senha Logado | ⛔ **Não Implementado** | Inexistente na interface e no backend. |
| Logout e Revogação de Sessão | ⚠️ **Parcial** | Apenas apaga dados do `localStorage`; o token continua válido no servidor por 30 dias. |
| Armazenamento Seguro de Tokens | ❌ **Quebrado** | Armazena tokens JWT em `localStorage` em vez de cookies `HttpOnly; Secure; SameSite`. |
| Proteção contra XSS para Sessão | ❌ **Quebrado** | Vulnerável a roubo de token devido ao Stored XSS presente no JSON-LD das vagas. |

---

### B. Perfil do Candidato (Usuário)

| Fluxo / Tela | Status | Detalhes / Evidência |
|---|---|---|
| Tela de Perfil e Edição de Dados | ⛔ **Não Implementado** | Candidato não possui página `/perfil` ou `/minha-conta`. |
| Gerador de Currículo ATS Gratuito | ✅ **OK** | Funcional, estilizado e gera impressão PDF A4 perfeita via CSS `@media print`. |
| Salvamento de Currículo na Nuvem | ⚠️ **Parcial** | Endpoints `/api/resumes` existem, mas no frontend o gerador prioriza estado local e impressão direta. |
| Histórico de Candidaturas | ⛔ **Não Implementado** | As candidaturas são externas (WhatsApp, e-mail, link da empresa); a plataforma não registra histórico. |
| Vagas Favoritas / Alertas de Emprego | ⛔ **Não Implementado** | Não há mecanismo de favoritar vagas ou receber alertas personalizados. |
| Upload de Currículo em Arquivo (PDF/DOCX) | ⛔ **Não Implementado** | Plataforma não recebe anexos de currículo de candidatos. |
| Exclusão de Conta e Dados (LGPD) | ⛔ **Não Implementado** | Não há mecanismo para o usuário solicitar a eliminação de seus dados. |

---

### C. Perfil da Empresa (Recrutador)

| Fluxo / Tela | Status | Detalhes / Evidência |
|---|---|---|
| Cadastro de Empresa / Validação de CNPJ | ⛔ **Não Implementado** | Não há entidade, autenticação ou formulário para perfil empresarial. |
| Painel da Empresa (Dashboard) | ⛔ **Não Implementado** | Não há tela para a empresa gerenciar suas vagas publicadas. |
| Publicação de Vaga Gratuita | ⚠️ **Parcial** | Modal público aberto (`PostJobModal.tsx`). No Spring Boot aprova automaticamente sem moderação. |
| Publicação de Vaga VIP com Destaque | ⚠️ **Parcial** | Gera QR Code Pix com chave estática, mas não há conferência bancária automatizada vinculada a pedido real. |
| Visualização de Candidatos Recebidos | ⛔ **Não Implementado** | Candidatos enviam currículos diretamente pelos canais externos da empresa. |
| Pausar / Editar / Excluir Vaga pela Empresa | ⛔ **Não Implementado** | Uma vez enviada, a empresa não tem como alterar ou encerrar a vaga no portal. |

---

### D. Perfil de Administrador

| Fluxo / Tela | Status | Detalhes / Evidência |
|---|---|---|
| Painel de Moderação de Vagas (`/editdev`) | ⚠️ **Parcial** | Interface visual funciona, mas grava edições apenas no `localStorage` do computador do admin. |
| Autenticação Segura de Admin (2FA) | ❌ **Quebrado** | TOTP validado inteiramente no navegador; bypass simples via console do navegador. |
| Gestão de Usuários (Banir/Suspender) | ⛔ **Não Implementado** | Não há listagem de usuários ou controles de bloqueio administrativo. |
| Gestão de Cupons PcD (`AdminCoupons.tsx`) | ❌ **Quebrado** | O componente existe e conversa com o Cloudflare D1/KV, mas não está roteado em `App.tsx`. |
| Trilha de Auditoria de Ações Administrativas | ⛔ **Não Implementado** | Não há log persistente de quem alterou ou aprovou vagas. |
| Métricas e Analytics da Plataforma | ⛔ **Não Implementado** | Não há painel analítico de acessos, candidaturas ou conversões. |

---

## 5. Recomendações para Depois do Lançamento (Pós-Go-Live)

Após sanar os bloqueadores críticos listados na Seção 2, recomenda-se planejar as seguintes melhorias:

1. **Arquitetura de Backend Unificada:**  
   Decidir entre manter uma API monolítica conteinerizada (Spring Boot + PostgreSQL no Fly.io / AWS ECS) ou arquitetura 100% Serverless (Cloudflare Pages + D1 + Workers). A coexistência parcial atual causa divergências entre o ambiente local e a produção.
2. **Gateway de Pagamento Robusto:**  
   Substituir a geração manual de EMV Pix pela API oficial v2 da Efí com criação dinâmica de cobrança imediata (`POST /v2/cob`), associando um `txid` exclusivo a um pedido pendente no banco de dados e aguardando confirmação via webhook assinado por mTLS.
3. **Módulo Completo de Recrutador / Empresa:**  
   Implementar cadastro empresarial com consulta automatizada na Receita Federal (validação de CNPJ) e dashboard dedicado onde a empresa visualiza métricas de visualizações e cliques no link de candidatura.
4. **Trilha de Auditoria e LGPD:**  
   Adicionar registro estruturado de logs de segurança (quem logou, data/hora, IP, ações administrativas executadas) e disponibilizar um botão de autoatendimento para o candidato solicitar exclusão completa de seus dados pessoais.
5. **Cobertura de Testes Automatizados (CI/CD):**  
   Adicionar ao fluxo do GitHub Actions:
   - Testes unitários de serviços e controllers no backend (`mvn verify`).
   - Testes de componentes e fluxos no frontend com Vitest e Playwright.
   - Verificação contínua de vulnerabilidades em dependências (`npm audit` e OWASP Dependency-Check).

---

## 6. O Que Não Foi Possível Verificar e Por Quê

1. **Chamadas reais à API de Produção da Efí Bank (`scripts/test_efi_status.py`):**  
   *Motivo:* A regra número 2 da auditoria veda estritamente testes contra endpoints de produção ou movimentações financeiras reais com certificados do cliente.
2. **Execução em runtime de produção do Cloudflare D1 e Cloudflare KV:**  
   *Motivo:* Os serviços Cloudflare D1 e KV operam gerenciados na nuvem da Cloudflare. Sem as credenciais de vínculo do Wrangler (`wrangler d1` / `wrangler pages dev`), as funções foram analisadas estaticamente no código-fonte e emuladas localmente.
3. **Execução de testes do Spring Boot (`mvn test`):**  
   *Motivo:* O diretório `backend/src/test/` não existe no repositório (não há nenhum arquivo de teste automatizado implementado pela equipe até o momento).
4. **Auditoria de pacotes via `npm audit` conectado à internet:**  
   *Motivo:* O ambiente de sandbox local opera sem acesso irrestrito à internet, bloqueando consultas ao endpoint externo da NPM registry.
