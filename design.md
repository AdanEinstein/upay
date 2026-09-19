# Design System

Este é o primeiro arquivo a editar ao começar um novo projeto a partir deste template. Ele documenta a fundação visual herdada (mude com cuidado — é compartilhada por todo o app) e lista os pontos que normalmente mudam de projeto para projeto.

## Fundação herdada do template

- **Componentes:** [shadcn/ui](https://ui.shadcn.com), estilo `new-york`, ícones [lucide-react](https://lucide.dev). Configuração em `components.json`. Adicione novos componentes com `npx shadcn@latest add <componente>`.
- **CSS:** Tailwind v4, tokens de cor em `oklch` definidos em `resources/css/app.css` (bloco `:root` / `.dark`), mapeados para utilitários via `@theme`.
- **Tema por tenant:** a cor de destaque de cada organização é injetada via 4 CSS custom properties (`--tenant-primary`, `--tenant-primary-hover`, `--tenant-primary-soft`, `--tenant-on-primary`), definidas inline no `<html>` em `resources/views/app.blade.php` (evita FOUC) e mapeadas para `--primary`/`--color-brand*`. Vem de `App\Models\Organization` (`accent_color`, `accent_color_hover`, `accent_color_soft`, `on_primary_color`) via `HandleInertiaRequests`. Editar a paleta _padrão_ (fallback fora de contexto de tenant, ex. super-admin) em `resources/css/app.css`; a paleta _por cliente_ é dado, não código — editável em `/{organization}/organization-settings`.
- **Tipografia:** "Instrument Sans" (via `laravel-vite-plugin`'s font loader `bunny()`, configurado em `vite.config.ts`).
- **Border radius:** `--radius: 0.625rem` em `resources/css/app.css`.
- **i18n:** toda string visível ao usuário vem de tradução (`useTranslation()`/`t()` no frontend, `__()` no backend) — sem exceção, em todo o projeto. Ver `resources/js/lang/{pt-BR,en-US}/*.json` e `lang/{en,pt_BR}/*.php`. Ao adicionar qualquer texto novo, adicione a chave em **todos** os locales suportados.

## O que costuma mudar por projeto

- [ ] **Paleta de marca** — hoje neutra/placeholder (`--tenant-primary: #3667f6` etc. em `resources/css/app.css` e `database/migrations/..._create_organizations_table.php`). Ajuste os defaults para a cor da sua marca (o tenant ainda pode sobrescrever a própria cor via `/organization-settings`).
- [ ] **Fonte** — trocar o `bunny()` font loader em `vite.config.ts` e a variável `--font-sans` em `resources/css/app.css`.
- [ ] **`--radius`** — densidade/arredondamento dos componentes.
- [ ] **Logo** — `resources/js/components/app-logo.tsx` e `app-logo-icon.tsx` (fallback quando a organização não tem logo própria enviada).
- [ ] **Favicon / ícones** — `public/favicon.ico`, `public/favicon.svg`, `public/apple-touch-icon.png`.
- [ ] **Nome do app** — `.env` (`APP_NAME`), usado em `<title>` e no header padrão.
- [ ] **Componentes shadcn adicionais** — instale sob demanda com `npx shadcn@latest add <nome>`; mantenha o estilo `new-york` para consistência.

## Convenções

- Componentes reutilizáveis ficam em `resources/js/components/`; componentes shadcn "crus" ficam em `resources/js/components/ui/` e normalmente não são editados à mão (regenere via CLI em vez de editar).
- Páginas Inertia ficam em `resources/js/pages/`, organizadas por área (`auth/`, `settings/`, `admin/`, `super/`, `super-admin/`).
- Nunca hardcode cor de marca em um componente — use os tokens (`bg-primary`, `text-primary-foreground`, `bg-brand`, etc.) para que o tema por tenant funcione automaticamente.
