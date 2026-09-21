# Plano de importação do design (Claude Design → Upay)

Projeto de design: `fae341f8-3284-4a05-9ffd-992ea43428c3` (leitura via tool `DesignSync`: `list_files` / `get_file`).
Protótipos são `*.dc.html` mobile 390x844; o design system fica em `_ds/upay-design-system-*/`.
Decisão do usuário: frontend **e** backend reais, uma etapa por vez, validando cada uma.

Legenda: `[x]` feito · `[~]` implementado mas não validado · `[ ]` pendente.
Estado verificado em 2026-09-21 (`php artisan test`: 160/160 passando). Commitado localmente em fatias (sem push).

## Convenções que valem para toda etapa
- i18n obrigatório: `t()`/`__()` + chave em pt-BR **e** en-US (`resources/js/lang/{pt-BR,en-US}/*.json`, `lang/{en,pt_BR}/*.php`). Lojista usa o namespace `shop`; público usa `public`.
- Rotas do lojista: `routes/shop.php` (dentro de `/{organization}/...`, middleware `auth` + `SetOrganizationContext`). Controllers em `app/Http/Controllers`, requests em `app/Http/Requests`, modelos de tenant com `BelongsToTenant`.
- UI mobile: `layouts/shop-layout.tsx`, componentes em `resources/js/components/shop/` (`bottom-nav`, `bottom-sheet`, `share-sheet`, `chip`, `empty-state`, `status-badge`, `screen-title`, `page-header`...). Cor de marca via classes `bg-brand`/`text-brand`/`bg-brand-soft`.
- Formatação: `hooks/use-format.ts`, `lib/money.ts`. Usar `i18n.resolvedLanguage` (não `i18n.language`) para números/datas.
- Testes Pest que renderizam Inertia exigem `pnpm run build` antes. Rodar `vendor/bin/pint --dirty --format agent` ao mexer em PHP.
- Limite de plano: `Organization::hasReachedCustomerLimit()` → redireciona a `plan-limit.show` no store de clientes.
- Antes de editar, ler `.ai/rules/index.md` se existir e `design.md`.

## Etapas

### [x] Etapa 0 — Comuns (`Comuns.dc.html`)
Login, recuperar senha, cadastro + planos, onboarding, prompt PWA, tela de limite de plano.
Arquivos: `pages/auth/*`, `pages/onboarding.tsx`, `pages/plan-limit.tsx`, `components/install-prompt.tsx`, `public/manifest.webmanifest`.

### [x] Etapa 1 — Super Admin (`SuperAdmin.dc.html`)
Sidebar desktop, dashboard (MRR/churn), planos CRUD, organizações (plano, filtros, detalhe, trocar plano, bloquear com motivo).
Arquivos: `pages/super/*`, `app/Http/Controllers/Super/*`, `routes/super-admin.php`, testes `SuperAdmin*Test.php`.

### [~] Etapa 2 — Lojista (Início, Vendas, Nova venda, Clientes, Produtos, Catálogo, Financeiro, BottomNav)
Implementado (controllers + páginas + testes existem): `home`, `sales/*` (+ parcelas/recebíveis), `customers/*`, `products/*` (+ estoque), `finance` + `expenses/*` + `payables` + `receivables`, `catalog/*` + `promotions/*`, `components/shop/bottom-nav.tsx`.
- [ ] 2.1 Conferir tela a tela contra `Lojista-Inicio/Vendas/NovaVenda/Clientes/Produtos/Catalogo/Financeiro.dc.html` (lacunas visuais, estados vazio/erro/carregando/limite). Fazer com o app rodando (`composer run dev`) e comparar com o protótipo.
- [x] 2.2 FEITO 2026-09-21: `BottomNav.dc.html` × `bottom-nav.tsx` conferido (4 abas + FAB 56px/-22px, altura 84px, safe-area); ajustado só o `gap` do rótulo (3px). Diferenças mantidas de propósito: ícone preenchido na aba ativa e bottom-sheet de ações rápidas no FAB (protótipo leva direto a Nova venda).

### [x] Etapa 3 — Config / Mais + Compartilhar (`Lojista-Config.dc.html`, telas 2.26–2.27)
Já existe: `pages/more.tsx` (Dados da loja, Chave PIX, card Meu plano com barras de uso, gestão, Configurações, Sair), `pages/pix-key.tsx`, `components/shop/share-sheet.tsx` usado em `customers/show`, `sales/show`, `catalog/show` (abas Cobrança / Convite ao catálogo, texto editável, "Abrir WhatsApp" via `lib/whatsapp.ts`).
- [x] 3.1 `more.tsx`: botão outline **"Ver planos"** no card Meu plano → `organization-settings.edit` (mesmo destino de `plan-limit.tsx`; ainda não existe página de planos do lojista).
- [x] 3.2 `more.tsx`: linha **"Ajuda"** acima de "Sair", link WhatsApp de suporte vindo de `config('services.support.whatsapp')` (env `SUPPORT_WHATSAPP`, prop `supportWhatsapp` do `MoreController`); oculta se vazio. Teste em `CatalogTest.php`.
- [x] 3.3 FEITO 2026-09-21: templates conferidos com `Lojista-Config.dc.html` (2.26). Sem mudança de código. Cobrança em `home.tsx` já usa o texto do protótipo (parcela vence hoje); em `customers/show` e `sales/show` a mensagem fala de **saldo** (`share.chargeMessage`) porque o sheet cobra o total em aberto, não uma parcela — mantido de propósito. Convite (`catalog.shareMessage`) omite o "tem peça nova chegando toda semana!" do protótipo (promessa específica de moda, não vale p/ toda loja). Links: `publicDebtUrl(publicToken)` → `/p/{token}`; catálogo → `host/c/{slug}` (`CatalogController`). Chaves `share.inviteMessage` (pt-BR/en-US) parecem órfãs — ver 6.3.
- [x] 3.4 Chaves `more.viewPlans/help/helpMessage` em pt-BR e en-US (`shop.json`).

### [x] Etapa 4 — Cliente final (`ClienteFinal.dc.html`, telas 3.1–3.8) — públicas, sem login
Hoje `/p/{token}` é `Route::inertia('p/{token}', 'public/debt')` com **dados de exemplo** (`pages/public/debt.tsx`).
- [x] 4.1 Backend `PublicDebtController` (rota `public.debt`, throttle 60/min, ativa `Tenant::use` e tema da loja; loja suspensa também cai em 404). Página `public/invalid` sem botão "Falar com a loja" (token inválido não identifica a loja). Detalhes originais: Backend `/p/{token}`: controller que resolve `customers.public_token` com `withoutTenant()`, devolve só parcelas/pagamentos/PIX da loja (ver `docs/database-schema.md`, "Página pública"). Token inválido → tela 3.4 (404 com página "Este link não é mais válido" + botão "Falar com a loja" se houver WhatsApp). Throttle na rota.
- [x] 4.2 Front (`public/debt.tsx` com conta → compra → PIX em estado local; tudo pago = tela cheia). Original: Front `public/debt.tsx`: 3.1 Minha conta (total em aberto, compras com badge Atrasada/Pago, "Olá, {nome}") e estado "Tudo pago"; 3.2 detalhe da compra (itens, total/já pago/falta, parcelas com status); 3.3 Pagar com PIX (valor, QR, "Copiar código PIX", instruções, "a baixa é confirmada pela loja"). Trocar `sample` por props reais.
- [x] 4.3 PIX real (`App\Support\PixPayload`: EMV + CRC16; QR SVG server-side via `bacon/bacon-qr-code`, dependência transitiva do Fortify; cidade fixa "BRASIL"). Original: PIX real: gerar BR Code (copia-e-cola EMV + CRC16) a partir da chave PIX da loja (`pix-key`) e valor da parcela; QR renderizado no cliente ou SVG no servidor. Decidir biblioteca só se necessário (não adicionar dependência sem aprovação).
- [x] 4.4 FEITO 2026-09-21: URL `/c/{slug}` (`PublicCatalogController`, rota `public.catalog`; `p` e `c` viraram slugs reservados; link do lojista em `CatalogController::show` já aponta p/ `/c/{slug}`). Produtos vêm via `Inertia::defer` (skeleton), detalhe do produto em estado local, promoção calculada por produto, loja não publicada/suspensa/inexistente → 404 `public/catalog-unavailable`. Original: Catálogo público 3.5–3.8: home (aviso, capa/logo, busca, chips de categoria, promoções, grade), detalhe do produto (fotos, tamanhos, "Pedir pelo WhatsApp"), estados carregando (skeleton), loja indisponível (não publicada) e catálogo vazio. **Decisão em aberto:** URL pública (`/c/{slug}` vs slug direto, já que tenants usam prefixo `/{organization}/`; "super-admin" é slug reservado). Reaproveitar dados de `catalog/preview` e `ShopSetting`/`Promotion`.
- [x] 4.5 `PublicDebtPageTest.php` + `PublicCatalogTest.php` (catálogo vazio só validado na UI, sem teste). Testes Pest: token válido/inválido, isolamento entre tenants, tudo pago, catálogo despublicado/vazio. i18n `public.json` pt-BR/en-US.

### [x] Etapa 5 — Landing (`Landing-NovosLojistas.dc.html`)
`pages/welcome.tsx` (i18n `welcome.json`) veio do commit "nova página inicial traduzida" e **não foi comparada** com o protótipo.
- [x] 5.1 FEITO 2026-09-21: `welcome.tsx` reescrito conforme o protótipo (nav, hero + card resumo, recursos, 3 passos, planos, CTA final, rodapé). `WelcomeController` passa `plans` reais (`Plan::publicList()`, também usado por `RegisterController`). O formulário de slug da loja virou a seção `#entrar` (link "Entrar" do nav). Omitidos do protótipo por não haver base no app: "142 lojas", "14 dias grátis/sem cartão", links Termos/Privacidade/Contato. Teste em `ExampleTest.php`; i18n `welcome.json` pt-BR/en-US.

### [ ] Etapa 6 — Fechamento
- [x] 6.1 FEITO 2026-09-21: `ShopSetting::hasLiveNotice()` usava `isPast()` (instante atual); trocado por `isBefore(today())` — aviso com validade hoje segue ativo até o fim do dia.
- [x] 6.2 FEITO 2026-09-21: `pnpm run build` ok, `pnpm run types:check` ok, pint ok, `php artisan test`: 160/160. `pnpm run check` (`vp check`) falha só por **formatação** em ~92 arquivos, inclusive já commitados (`.design-sync/*`, `components.json`) — dívida pré-existente, não corrigida (`vp check --fix` reformataria o repo todo; decidir separadamente).
- [x] 6.3 FEITO 2026-09-21: paridade pt-BR × en-US verificada (`resources/js/lang/*.json` e `lang/{pt_BR,en}/*.php`): 0 divergências. Chaves `share.inviteMessage` seguem órfãs (podem ser removidas).
- [x] 6.4 FEITO 2026-09-21: 5 commits temáticos + docs (etapa 1; etapa 0; etapas 2+3; etapa 4; etapa 5 + `routes/web.php`). Divisão por arquivo inteiro — arquivos compartilhados (`app.tsx`, `i18n.ts`, rotas) caíram na fatia que os fecha, então commits intermediários podem não compilar sozinhos; o HEAD final passa. Sem push.
- [ ] 6.5 Atualizar este arquivo e a memória `project_design_import_phases.md` ao concluir cada etapa.

## Ordem sugerida
3 (rápida, fecha o Lojista) → 4.1–4.3 (dívida pública real) → 4.4 (após decidir a URL) → 2.1/2.2 (validação visual) → 5 → 6.
