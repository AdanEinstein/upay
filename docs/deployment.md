# Deployment

Dev e prod rodam na mesma VPS, via runner self-hosted do GitHub Actions + `docker compose`. Uma imagem só (`Dockerfile`), com o papel escolhido por `APP_ROLE` (`app`, `queue`, `reverb`, `scheduler` — ver `docker/entrypoint.sh`).

|                   | Development                                             | Production                                                |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Gatilho           | push em `develop`                                       | tag `v*` (rollback: _Run workflow_ com uma tag existente) |
| Workflow          | `deploy-development.yml`                                | `deploy-production.yml`                                   |
| Compose           | `docker-compose.dev.yml` (`upay-dev`)                   | `docker-compose.prod.yml` (`upay-prod`)                   |
| Imagem            | `upay:dev`                                              | `upay:<tag>` (mantém as 5 últimas)                        |
| Postgres          | container `db`                                          | Supabase (session pooler)                                 |
| Uploads           | volume docker `upay-dev-storage`, servido em `/storage` | Supabase Storage (buckets público + privado)              |
| Sessão/cache      | database                                                | redis (container)                                         |
| App (loopback)    | `127.0.0.1:8011`                                        | `127.0.0.1:8010`                                          |
| Reverb (loopback) | `127.0.0.1:8095`                                        | `127.0.0.1:8094`                                          |

O `.env.<ambiente>` é gerado a cada deploy a partir dos secrets do GitHub Environment e lido pelo compose com `format: raw` (valores literais — `$` do hash bcrypt não é interpolado). Requer Docker Compose ≥ 2.30.

## Secrets (GitHub → Settings → Environments)

Crie os environments `development` e `production` com:

**Ambos**

| Secret                                                                                         | Observação                                                      |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `APP_KEY`                                                                                      | `php artisan key:generate --show` (um por ambiente)             |
| `APP_URL`                                                                                      | `https://dev.<domínio>` / `https://<domínio>`                   |
| `PORT`                                                                                         | opcional; padrão 8011 (dev) / 8010 (prod)                       |
| `PASSKEYS_USER_HANDLE_SECRET`                                                                  | `php -r 'echo base64_encode(random_bytes(32));'`                |
| `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`                                                        |                                                                 |
| `SUPER_ADMIN_PASSWORD_HASH`                                                                    | `php artisan tinker --execute='echo Hash::make("senha");'`      |
| `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`                                         | valores aleatórios, um trio por ambiente                        |
| `REVERB_HOST`, `REVERB_PORT`, `REVERB_SCHEME`                                                  | públicos, vistos pelo navegador: domínio do app, `443`, `https` |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` | ou `MAIL_MAILER=resend` + `RESEND_API_KEY`                      |
| `SUPPORT_WHATSAPP`                                                                             | opcional                                                        |
| `BILLING_PIX_KEY`, `BILLING_PIX_KEY_TYPE`, `BILLING_MERCHANT_NAME`                             | chave vazia = cobrança sem QR                                   |

**Só development**: `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (criam o Postgres do container).

**Só production**

| Secret                                                            | Onde achar no Supabase                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Connect → **Session pooler** (porta 5432; o transaction pooler 6543 quebra prepared statements do PDO) |
| `DB_SSLMODE`                                                      | `require`                                                                                              |
| `SUPABASE_URL`                                                    | `https://<ref>.supabase.co`                                                                            |
| `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_REGION`                      | Storage → S3 Connection (`https://<ref>.storage.supabase.co/storage/v1/s3`)                            |
| `SUPABASE_S3_KEY`, `SUPABASE_S3_SECRET`                           | Storage → S3 Connection → New access key                                                               |
| `SUPABASE_PUBLIC_BUCKET`                                          | bucket **público** (logos, capas, fotos de produto, despesas)                                          |
| `SUPABASE_PRIVATE_BUCKET`                                         | bucket **privado** (comprovantes de pagamento/assinatura)                                              |

## Setup único na VPS

1. Registrar um runner self-hosted para o repo (Settings → Actions → Runners), com o usuário do runner no grupo `docker`.
2. Repo público: Settings → Actions → General → exigir aprovação para workflows de forks.
3. Nginx do host terminando TLS, com proxy para as portas de loopback acima e `Upgrade`/`Connection` no path do Reverb (`/app`, `/apps`). Envie `X-Forwarded-Proto` — o app confia no proxy (`trustProxies('*')`), seguro porque os containers só escutam em `127.0.0.1`.
4. Criar a branch `develop` e o primeiro deploy de prod com `git tag v0.1.0 && git push origin v0.1.0`.

## Operação

- Logs: `docker compose -p upay-prod logs -f app queue` (o app loga em stderr).
- Rollback: Actions → Deploy Production → Run workflow → tag anterior (sem rebuild).
- Comandos: `docker compose -p upay-prod exec app php artisan <cmd>`.
