# Upay — conventions

Upay is a shadcn/ui ("radix-maia") library on Tailwind v4 with Radix primitives. UI copy is Brazilian Portuguese (pt-BR): write labels, placeholders, currency (`R$ 1.234,56`) and dates (`10/09/2026`) that way.

## Setup

- Link `styles.css` (it imports fonts, tokens and `_ds_bundle.css`). Components are on `window.Upay.*`. Body font is Outfit (`font-sans`); headings use Raleway (`font-heading`).
- Colors are CSS variables. Dark mode = a `dark` class on an ancestor (e.g. `<html class="dark">`).
- Some parts only work inside their root: wrap `Tooltip` in `TooltipProvider`; wrap `Sidebar*` in `SidebarProvider` (`Sidebar collapsible="none"` for a static rail); compose `Dialog`/`Sheet`/`DropdownMenu`/`Select` from their own `*Trigger`/`*Content`/`*Item` parts. Sub-parts (`CardHeader`, `DialogTitle`, `SidebarMenuButton`…) are separate exports with their own `.d.ts`.
- `Icon` renders a lucide component passed as `iconNode`. Inside `Button`, mark icons `data-icon="inline-start"` / `"inline-end"`.
- App-level components (`AppShell`, `AppSidebar`, `AppHeader`, `NavUser`, `Passkey*`…) render out of the box in pt-BR: the bundle ships the app's real pt-BR translations and mock session data (tenant "Loja Exemplo", user "Maria Souza"); links render as plain anchors. Build a full page as `AppShell` > `AppSidebar` + `AppContent` (with `AppSidebarHeader` for breadcrumbs).
- **Nothing native for dates, times or overlays.** Never use `<input type="date|time|datetime-local">` or `<select>`. Use `DatePicker` (`value: Date`, `onChange`), `TimePicker` (`value: "HH:mm"`), `DateTimePicker`, or `Calendar` (`mode="single"|"range"`) — all pt-BR by default (`locale`), built on `Popover`/`PopoverTrigger`/`PopoverContent`. For dropdowns use `Select`.

## Styling idiom: Tailwind utilities + tokens

No CSS-in-JS and no style props: style with `className`. Never hardcode colors — use token utilities so the tenant theme works:

| Family   | Classes                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| Surfaces | `bg-background` `bg-card` `bg-muted` `bg-secondary` `bg-accent` `bg-primary` `bg-brand` `bg-brand-soft`              |
| Text     | `text-foreground` `text-muted-foreground` `text-primary` `text-destructive` `text-brand` `text-primary-foreground`   |
| Border   | `border` `border-border` (also `rounded-lg` `rounded-xl` `rounded-full`)                                             |
| Type     | `text-xs` … `text-3xl`, `font-medium` `font-semibold` `font-heading`                                                 |
| Layout   | `flex` `grid` `grid-cols-{1,2,3,4,6,12}` `items-*` `justify-*` `gap-{0…16}` `p*-`/`m*-{0…16}` `w-*` `max-w-{sm…2xl}` |

Raw variables for inline styles: `var(--background)`, `--foreground`, `--card`, `--primary`, `--muted-foreground`, `--destructive`, `--border`, `--ring`, `--radius`, `--sidebar*`. Tenant brand: `--tenant-primary`, `--tenant-primary-hover`, `--tenant-primary-soft`, `--tenant-on-primary` (re-skin by overriding these). Only classes present in `_ds_bundle.css` are styled — grep it before using an unusual utility.

## Where to look

`styles.css` → `_ds_bundle.css` (real token values and every utility). Per component: `components/<group>/<Name>/<Name>.d.ts` (props) and `<Name>.prompt.md` (usage).

## Example

```jsx
const {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Badge,
    Button,
} = window.Upay;

<Card className="w-96">
    <CardHeader>
        <CardTitle>Parcelas do mês</CardTitle>
        <CardDescription>Cobranças com vencimento em setembro.</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
        <span className="text-3xl font-semibold">R$ 18.450,00</span>
        <Badge variant="secondary">12 abertas</Badge>
    </CardContent>
    <CardFooter className="gap-2">
        <Button size="sm">Ver parcelas</Button>
        <Button size="sm" variant="outline">
            Exportar
        </Button>
    </CardFooter>
</Card>;
```
