import { WhatsappLogoIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/shop/bottom-sheet';
import { Chip } from '@/components/shop/chip';
import Textarea from '@/components/shop/textarea';
import { Button } from '@/components/ui/button';
import { whatsappUrl } from '@/lib/whatsapp';

export type ShareTemplate = { key: string; label: string; message: string };

export default function ShareSheet({
    open,
    onOpenChange,
    phone,
    templates,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    phone: string | null;
    templates: ShareTemplate[];
}) {
    const { t } = useTranslation('shop');
    const [key, setKey] = useState(templates[0]?.key);
    const [edited, setEdited] = useState<Record<string, string>>({});
    const current = templates.find((template) => template.key === key) ?? templates[0];
    const message = edited[current.key] ?? current.message;

    return (
        <BottomSheet open={open} onOpenChange={onOpenChange} title={t('share.title')}>
            {templates.length > 1 && (
                <div className="flex gap-2">
                    {templates.map((template) => (
                        <Chip
                            key={template.key}
                            active={template.key === current.key}
                            onClick={() => setKey(template.key)}
                        >
                            {template.label}
                        </Chip>
                    ))}
                </div>
            )}
            <Textarea
                value={message}
                onChange={(event) =>
                    setEdited({ ...edited, [current.key]: event.target.value })
                }
                className="min-h-28 leading-relaxed"
            />
            <Button asChild size="lg" className="h-12 w-full text-base">
                <a
                    href={whatsappUrl(phone, message)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onOpenChange(false)}
                >
                    <WhatsappLogoIcon className="size-[17px]" />
                    {t('share.open')}
                </a>
            </Button>
        </BottomSheet>
    );
}
