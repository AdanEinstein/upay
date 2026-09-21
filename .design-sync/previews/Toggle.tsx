import { Toggle } from 'upay';
import { TextBIcon, TextItalicIcon } from '@phosphor-icons/react';

export const Variants = () => (
    <div className="flex items-center gap-3">
        <Toggle aria-label="Negrito">
            <TextBIcon />
        </Toggle>
        <Toggle variant="outline" aria-label="Itálico" defaultPressed>
            <TextItalicIcon />
        </Toggle>
        <Toggle variant="outline">Somente em aberto</Toggle>
        <Toggle disabled>Indisponível</Toggle>
    </div>
);
