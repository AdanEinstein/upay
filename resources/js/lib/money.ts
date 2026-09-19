// Money is always stored and passed around as integer cents (see docs/database-schema.md).
export function formatMoney(cents: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'BRL',
    }).format(cents / 100);
}

// `YYYY-MM-DD` parsed as local midnight, so the day never shifts with the timezone.
export function formatDay(isoDate: string, locale: string): string {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
    });
}
