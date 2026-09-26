// Registers the service worker (resources/js/service-worker.js, served at
// /service-worker) and talks to it: which store's offline page to keep, who
// is logged in, which screens to fetch ahead so they open offline, and when
// the page on screen is a saved copy.
import { currentOrganization } from '@/lib/organization';
import { appOffline, dashboard, serviceWorker } from '@/routes';
import { edit as appearance } from '@/routes/appearance';
import { show as billing } from '@/routes/billing';
import { preview as catalogPreview, show as catalog } from '@/routes/catalog';
import { edit as catalogIdentity } from '@/routes/catalog/identity';
import { edit as catalogNotice } from '@/routes/catalog/notice';
import { create as newCustomer, index as customers } from '@/routes/customers';
import { create as newExpense, index as expenses } from '@/routes/expenses';
import { index as finance } from '@/routes/finance';
import { edit as language } from '@/routes/locale';
import { show as more } from '@/routes/more';
import { edit as organizationSettings } from '@/routes/organization-settings';
import { index as payables } from '@/routes/payables';
import { edit as pixKey } from '@/routes/pix-key';
import { create as newProduct, index as products } from '@/routes/products';
import { edit as profile } from '@/routes/profile';
import {
    create as newPromotion,
    index as promotions,
} from '@/routes/promotions';
import { index as receivables } from '@/routes/receivables';
import { create as newSale, index as sales } from '@/routes/sales';
import { edit as security } from '@/routes/security';

let cachedAt: string | null = null;
const listeners = new Set<() => void>();
let prepared: Record<string, unknown> | null = null;

// `vite dev` serves each screen's code on demand, so it is all loaded ahead
// for the worker to cache. The production build is precached whole.
const devPages = import.meta.env.DEV
    ? import.meta.glob('../pages/**/*.tsx')
    : {};

function post(message: Record<string, unknown>): void {
    void navigator.serviceWorker?.ready.then((registration) =>
        registration.active?.postMessage(message),
    );
}

export function initializeOfflinePage(): void {
    const organization = currentOrganization();

    if (!('serviceWorker' in navigator) || !organization) {
        return;
    }

    navigator.serviceWorker.register(serviceWorker.url()).catch(() => {});
    post({ type: 'offline-page', url: appOffline.url({ organization }) });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'cached') {
            cachedAt = event.data.cachedAt;
            listeners.forEach((listener) => listener());
        }

        // A new worker (new deploy) starts with no saved pages.
        if (event.data?.type === 'activated' && prepared) {
            post(prepared);
        }
    });
}

/**
 * When the screen on display was saved (ISO string), or null if it is live.
 */
export function offlineCachedAt(): string | null {
    return cachedAt;
}

export function subscribeToCachedAt(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

/**
 * Hands the worker the logged-in user (it drops another user's saved pages)
 * and the screens to fetch ahead, including the new-sale form, which carries
 * the product and customer lists needed to sell offline.
 */
export function prepareOfflinePages(
    userId: number,
    version: string | null,
): void {
    // Once per page load: the layout re-mounts on some navigations.
    if (prepared?.userId === userId) {
        return;
    }

    prepared = {
        type: 'prepare',
        userId,
        version,
        // Every screen without an id in its URL; records (a sale, a customer)
        // open offline once they have been viewed online.
        urls: [
            dashboard,
            sales,
            newSale,
            receivables,
            customers,
            newCustomer,
            products,
            newProduct,
            finance,
            expenses,
            newExpense,
            payables,
            catalog,
            catalogPreview,
            catalogIdentity,
            catalogNotice,
            promotions,
            newPromotion,
            more,
            pixKey,
            billing,
            organizationSettings,
            profile,
            appearance,
            language,
            security,
        ].map((route) => route.url()),
    };
    post(prepared);
    Object.values(devPages).forEach((load) => void load());
}

export function clearOfflinePages(): void {
    prepared = null;
    post({ type: 'clear' });
}
