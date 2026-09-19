import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import adminEnUS from '@/lang/en-US/admin.json';
import authEnUS from '@/lang/en-US/auth.json';
import commonEnUS from '@/lang/en-US/common.json';
import dashboardEnUS from '@/lang/en-US/dashboard.json';
import navEnUS from '@/lang/en-US/nav.json';
import publicEnUS from '@/lang/en-US/public.json';
import settingsEnUS from '@/lang/en-US/settings.json';
import superEnUS from '@/lang/en-US/super.json';
import adminPtBR from '@/lang/pt-BR/admin.json';
import authPtBR from '@/lang/pt-BR/auth.json';
import commonPtBR from '@/lang/pt-BR/common.json';
import dashboardPtBR from '@/lang/pt-BR/dashboard.json';
import navPtBR from '@/lang/pt-BR/nav.json';
import publicPtBR from '@/lang/pt-BR/public.json';
import settingsPtBR from '@/lang/pt-BR/settings.json';
import superPtBR from '@/lang/pt-BR/super.json';

export const defaultNS = 'common';

export const resources = {
    'pt-BR': {
        common: commonPtBR,
        nav: navPtBR,
        auth: authPtBR,
        settings: settingsPtBR,
        admin: adminPtBR,
        dashboard: dashboardPtBR,
        public: publicPtBR,
        super: superPtBR,
    },
    'en-US': {
        common: commonEnUS,
        nav: navEnUS,
        auth: authEnUS,
        settings: settingsEnUS,
        admin: adminEnUS,
        dashboard: dashboardEnUS,
        public: publicEnUS,
        super: superEnUS,
    },
} as const;

export function initializeI18n(locale: string) {
    void i18next.use(initReactI18next).init({
        resources,
        lng: locale,
        fallbackLng: 'pt-BR',
        defaultNS,
        interpolation: {
            escapeValue: false,
        },
    });
}

export default i18next;
