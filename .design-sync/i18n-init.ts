import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultNS, resources } from '../resources/js/lib/i18n';

// Inicialização síncrona (initAsync: false) para o primeiro render já sair traduzido.
void i18next.use(initReactI18next).init({
    resources,
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    defaultNS,
    interpolation: { escapeValue: false },
    initAsync: false,
});
