import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';

export default function AppearanceToggleTab({
    compact = false,
    ...props
}: Omit<
    ComponentProps<typeof ToggleGroup>,
    'type' | 'value' | 'defaultValue' | 'onValueChange'
> & {
    // Icons only, for narrow containers such as the super-admin sidebar.
    compact?: boolean;
}) {
    const { t } = useTranslation('settings');
    const { appearance, updateAppearance } = useAppearance();

    const options: { value: Appearance; icon: Icon; label: string }[] = [
        {
            value: 'light',
            icon: SunIcon,
            label: t('settings:appearance.light'),
        },
        { value: 'dark', icon: MoonIcon, label: t('settings:appearance.dark') },
        {
            value: 'system',
            icon: DesktopIcon,
            label: t('settings:appearance.system'),
        },
    ];

    return (
        <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            aria-label={t('settings:nav.appearance')}
            value={appearance}
            // Radix reports '' when the active item is clicked again; keep the current choice.
            onValueChange={(value) =>
                value && updateAppearance(value as Appearance)
            }
            {...props}
        >
            {options.map(({ value, icon: Icon, label }) => (
                <ToggleGroupItem
                    key={value}
                    value={value}
                    aria-label={compact ? label : undefined}
                    title={compact ? label : undefined}
                >
                    <Icon data-icon="inline-start" />
                    {!compact && label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
