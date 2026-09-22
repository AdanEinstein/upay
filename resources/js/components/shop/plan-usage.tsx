import { useTranslation } from 'react-i18next';

export type PlanUsageItem = {
    key: 'customers' | 'products' | 'sales';
    used: number;
    limit: number | null;
};

export default function PlanUsage({ items }: { items: PlanUsageItem[] }) {
    const { t } = useTranslation('shop');

    return (
        <>
            {items.map((item) => (
                <div key={item.key}>
                    <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                        <span>{t(`more.usage.${item.key}`)}</span>
                        <span>
                            {item.limit === null
                                ? item.used
                                : `${item.used}/${item.limit}`}
                        </span>
                    </div>
                    {item.limit !== null && (
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                            <div
                                className="bg-brand h-full rounded-full"
                                style={{
                                    width: `${Math.min(100, (item.used / item.limit) * 100)}%`,
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}
