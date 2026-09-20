# design-sync notes — Upay

- Repo é app Laravel + Inertia (sem `dist/`, sem Storybook, `package.json` da raiz sem `name`). `.design-sync/build-inputs.mjs` gera `dist/` (fake package `upay`): `entry.ts` (export * dos .tsx de `resources/js/components` + `export { default as X }` para default exports), `types/` (tsc emitDeclarationOnly), `styles.css` (Tailwind v4 CLI compilando `.design-sync/tailwind-input.css`, que escaneia `resources/js` e `.design-sync/previews`), `files/` (woff2 do fontsource), `component-docs/<Name>.md` (stubs só com `category` → grupo por arquivo).
- **Antes de todo build**: `node .design-sync/build-inputs.mjs` (buildCmd). Previews novos com classes Tailwind novas só entram no CSS depois disso.
- `.ds-sync/` precisa de `esbuild ts-morph @types/react @tailwindcss/cli@4.3.3 playwright@1.61.1` (chromium 1228 em ~/.cache/ms-playwright).
- Não usar `dist/docs` (o conversor copia `docs/*.md` para guidelines/).
- Componentes são exports planos (CardHeader etc. viram componentes separados no índice, com floor card). Compostos sem contexto lançam erro → floor card (não é falha).
- Previews importam de `'upay'`; ícones de `@phosphor-icons/react` funcionam.
- Overlays (Dialog etc.): `overrides.<Name> = {cardMode: single, viewport: 640x420, primaryStory}`.
- Autofoco do Radix seleciona texto de input com defaultValue — usar `placeholder` em previews de Dialog.
- `tailwind-input.css` tem um `@source inline(...)` com utilitários comuns (spacing, flex/grid, tipografia, tokens) para o "glue" do design agent — sem isso só existem as classes usadas no fonte. Ao adicionar utilitário novo ao vocabulário do `conventions.md`, inclua-o lá.
- Nunca usar `DesignSync(get_file)` em `.html`/`_preview/*.js` só para comparar: despeja o arquivo inteiro no contexto.
- Close-out sem `--remote` na primeira sync: o driver (`resync.mjs`) reporta `anchor: not_provided` e todos os 155 como `added`; é esperado.

## Known render warns
- `Icon`: `[RENDER_THIN]` — só SVG, sem texto; screenshot confere (3 ícones visíveis). Benigno.

## Escopo (atualizado na revisão de 2026-09-20)
- 164 componentes; 59 com preview autorado (todos `good`): 29 primitivos `ui/`, 24 de app e 6 novos só-DS (Calendar, DatePicker, TimePicker, TimeColumns, DateTimePicker, Popover).
- Restam no floor card: subpartes dos compostos (CardHeader, DialogTitle…), `Toaster` (o `toast()` do sonner num preview usaria outra cópia do módulo) e os subcomponentes de Popover.
- Componentes só do design system (NÃO existem no app): `.design-sync/components/*.tsx` (popover, calendar, date-picker, time-picker, date-time-picker). Sem dependência nova (Popover do pacote `radix-ui`; datas via `Intl`). Decisão do usuário: ficam fora do código do Upay.
- `.design-sync/inertia-stub.tsx`: shim de `@inertiajs/react` (usePage com tenant "Loja Exemplo"/usuário "Maria Souza", Link vira `<a>`, Form/router no-op), ligado por `.design-sync/tsconfig.bundle.json`. Sem ele os componentes de app lançam "usePage must be used within the Inertia component".
- `.design-sync/i18n-init.ts`: inicializa i18next com os JSONs pt-BR reais (`initAsync: false`); sem isso os cards mostram chaves cruas (`settings:deleteAccount.warning`).
- `.design-sync/shims/app-logo-icon.tsx`: `AppLogoIcon` com a máscara embutida como data URI (o original usa `/logo-mark.png`, caminho absoluto que não resolve no projeto de design). `build-inputs.mjs` troca o arquivo do app por qualquer `.design-sync/shims/<nome>.tsx` de mesmo nome; o alias para os componentes que importam via `@/` está em `tsconfig.bundle.json`.
- `tsconfig.bundle.json` NÃO pode ter `@/*`: o plugin de paths do conversor resolve diretório (ex.: `@/routes`) como arquivo e quebra o build; `@/` fica com o esbuild nativo (tsconfig raiz). O plugin também ignora `extends`, por isso `baseUrl` é explícito.
- Revisão humana (`.review.html`) ainda não confirmada pelo usuário.

## Re-sync risks
- `dist/` é gerado por `build-inputs.mjs` a partir do fonte do app: qualquer novo arquivo `.tsx` em `resources/js/components` (ou `ui/`) entra automaticamente; mover/renomear arquivos regrupa componentes (grupo = nome do arquivo ui, ou `App`).
- Exports `default` só são capturados pelo regex de `build-inputs.mjs` (`export default function X` / `export default X;`) — outras formas ficam de fora silenciosamente.
- CSS depende de Tailwind 4.3.3 (`@tailwindcss/cli` isolado em `.ds-sync/`, versão fixada em separado da do app).
- Previews com overlay dependem de `cardMode: single` + viewport em `config.json`; mudar tamanho de Dialog/Sheet/Select pode exigir ajustar o viewport.
- `Sidebar` preview usa `h-[23rem]` + viewport 420x420 fixos; footer corta se o conteúdo crescer.
- Se o app mudar `useTranslation`/namespaces (`resources/js/lib/i18n.ts`), `.design-sync/i18n-init.ts` importa `resources`/`defaultNS` de lá — manter esses exports.
- Calendar/pickers usam `Intl` com `locale="pt-BR"`; textos como "Selecione uma data" são props com default pt-BR (não passam pelo i18n do app).

## TimeColumns (2026-09-20, feedback do Claude Design)
- Colunas Horas/Minutos usam altura flexível (`h-full max-h-80 min-h-56`, listbox `flex-1 min-h-0`) em vez de `h-56` fixo; itens `shrink-0` (sem isso encolhem quando o pai tem altura). Scrollbar fina via `scrollbar-width:thin` + `scrollbar-color`. Para expandir além de 20rem: `className="max-h-none"` num pai com altura definida (preview `ExpandedToParent`).
- Relatórios já resolvidos: chaves i18n cruas → `i18n-init.ts`; Calendar/DatePicker/DateTimePicker/TimePicker custom existem (nada nativo do browser).
