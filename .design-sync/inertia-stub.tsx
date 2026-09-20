// Shim de tempo de design para '@inertiajs/react' (usado só no bundle do Claude Design via tsconfig.bundle.json).
// O app real continua usando o Inertia de verdade; aqui só existem as APIs que os componentes importam.
import * as React from 'react';

const page = {
    component: 'app/dashboard',
    url: '/loja-exemplo/dashboard',
    version: 'design-sync',
    props: {
        name: 'Upay',
        sidebarOpen: true,
        auth: {
            user: {
                id: 1,
                name: 'Maria Souza',
                email: 'maria.souza@lojaexemplo.com.br',
                email_verified_at: '2026-01-10T12:00:00Z',
                created_at: '2026-01-10T12:00:00Z',
                updated_at: '2026-01-10T12:00:00Z',
            },
        },
        tenant: {
            slug: 'loja-exemplo',
            name: 'Loja Exemplo',
            logoUrl: null,
            accentColor: '#3667f6',
            accentColorHover: '#2454e0',
            accentColorSoft: '#eef3ff',
            onPrimaryColor: '#ffffff',
        },
    },
};

export function usePage<T = Record<string, unknown>>() {
    return page as unknown as { component: string; url: string; version: string; props: T & typeof page.props };
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href?: string | { url: string };
    as?: string;
    method?: string;
    [key: string]: unknown;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
    { href, as, method, prefetch, preserveScroll, preserveState, replace, only, data, viewTransition, cacheFor, children, onClick, ...rest },
    ref,
) {
    void [method, prefetch, preserveScroll, preserveState, replace, only, data, viewTransition, cacheFor];
    const url = typeof href === 'string' ? href : (href?.url ?? '#');
    const handle = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onClick?.(e);
    };
    if (as === 'button') {
        return (
            <button type="button" ref={ref as unknown as React.Ref<HTMLButtonElement>} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
                {children}
            </button>
        );
    }
    return (
        <a ref={ref} href={url} onClick={handle} {...rest}>
            {children}
        </a>
    );
});

const noop = () => undefined;
export const router = {
    visit: noop,
    get: noop,
    post: noop,
    put: noop,
    patch: noop,
    delete: noop,
    reload: noop,
    cancelAll: noop,
    flushAll: noop,
    on: () => noop,
};

type FormState = {
    errors: Record<string, string>;
    hasErrors: boolean;
    processing: boolean;
    wasSuccessful: boolean;
    recentlySuccessful: boolean;
    isDirty: boolean;
    progress: null;
    reset: () => void;
    clearErrors: () => void;
    resetAndClearErrors: () => void;
    setError: () => void;
};

const formState: FormState = {
    errors: {},
    hasErrors: false,
    processing: false,
    wasSuccessful: false,
    recentlySuccessful: false,
    isDirty: false,
    progress: null,
    reset: noop,
    clearErrors: noop,
    resetAndClearErrors: noop,
    setError: noop,
};

export function Form({ children, className, id }: { children?: React.ReactNode | ((state: FormState) => React.ReactNode); className?: string; id?: string; [key: string]: unknown }) {
    return (
        <form className={className} id={id} onSubmit={(e) => e.preventDefault()}>
            {typeof children === 'function' ? children(formState) : children}
        </form>
    );
}
