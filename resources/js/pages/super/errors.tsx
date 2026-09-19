import { Head, router } from '@inertiajs/react';
import { CopyIcon, EyeIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClipboard } from '@/hooks/use-clipboard';
import { index } from '@/routes/super-admin/errors';

type Occurrence = {
    id: number;
    status: number;
    method: string;
    path: string;
    exceptionClass: string | null;
    message: string | null;
    trace: string | null;
    organizationName: string | null;
    userName: string | null;
    createdAt: string;
};

type Props = {
    occurrences: {
        data: Occurrence[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    organizations: { id: number; name: string }[];
    statuses: number[];
    filters: { status: number | null; organizationId: number | null };
    kpis: { last24h: number; last7d: number };
};

const ALL = 'all';

function statusVariant(
    status: number,
): 'destructive' | 'secondary' | 'outline' {
    if (status >= 500) {
        return 'destructive';
    }

    return status === 404 ? 'outline' : 'secondary';
}

export default function Errors({
    occurrences,
    organizations,
    statuses,
    filters,
    kpis,
}: Props) {
    const { t, i18n } = useTranslation(['super', 'common']);
    const [, copy] = useClipboard();
    const [selected, setSelected] = useState<Occurrence | null>(null);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString(i18n.language, {
            dateStyle: 'short',
            timeStyle: 'short',
        });

    const applyFilters = (next: {
        status?: number | null;
        organizationId?: number | null;
    }) => {
        const merged = { ...filters, ...next };

        router.get(
            index().url,
            {
                status: merged.status ?? undefined,
                organization_id: merged.organizationId ?? undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const copyDetails = async (occurrence: Occurrence) => {
        const text = [
            `${occurrence.status} ${occurrence.method} /${occurrence.path}`,
            occurrence.exceptionClass,
            occurrence.message,
            occurrence.trace,
        ]
            .filter(Boolean)
            .join('\n\n');

        const copied = await copy(text);

        toast[copied ? 'success' : 'error'](
            t(
                copied
                    ? 'super:errors.detail.copied'
                    : 'super:errors.detail.copyFailed',
            ),
        );
    };

    const stats = [
        { label: t('super:errors.kpi.last24h'), value: kpis.last24h },
        { label: t('super:errors.kpi.last7d'), value: kpis.last7d },
    ];

    const hasFilters =
        filters.status !== null || filters.organizationId !== null;

    return (
        <>
            <Head title={t('super:errors.title')} />

            <div className="space-y-6">
                <Heading
                    title={t('super:errors.heading')}
                    description={t('super:errors.description')}
                />

                <div className="grid grid-cols-2 gap-3 md:max-w-md">
                    {stats.map((stat) => (
                        <Card key={stat.label} size="sm">
                            <CardHeader>
                                <CardTitle className="text-muted-foreground text-xs font-normal">
                                    {stat.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-2xl font-semibold tabular-nums">
                                {stat.value}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="filter-status">
                            {t('super:errors.filters.status')}
                        </Label>
                        <Select
                            value={filters.status?.toString() ?? ALL}
                            onValueChange={(value) =>
                                applyFilters({
                                    status:
                                        value === ALL ? null : Number(value),
                                })
                            }
                        >
                            <SelectTrigger id="filter-status" className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('super:errors.filters.allStatuses')}
                                </SelectItem>
                                {statuses.map((status) => (
                                    <SelectItem
                                        key={status}
                                        value={status.toString()}
                                    >
                                        {status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="filter-organization">
                            {t('super:errors.filters.organization')}
                        </Label>
                        <Select
                            value={filters.organizationId?.toString() ?? ALL}
                            onValueChange={(value) =>
                                applyFilters({
                                    organizationId:
                                        value === ALL ? null : Number(value),
                                })
                            }
                        >
                            <SelectTrigger
                                id="filter-organization"
                                className="w-56"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>
                                    {t('super:errors.filters.allOrganizations')}
                                </SelectItem>
                                {organizations.map((organization) => (
                                    <SelectItem
                                        key={organization.id}
                                        value={organization.id.toString()}
                                    >
                                        {organization.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {hasFilters && (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                applyFilters({
                                    status: null,
                                    organizationId: null,
                                })
                            }
                        >
                            {t('super:errors.filters.clear')}
                        </Button>
                    )}
                </div>

                {occurrences.data.length === 0 ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                        {t('super:errors.empty')}
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    {t('super:errors.table.when')}
                                </TableHead>
                                <TableHead>
                                    {t('super:errors.table.status')}
                                </TableHead>
                                <TableHead>
                                    {t('super:errors.table.path')}
                                </TableHead>
                                <TableHead>
                                    {t('super:errors.table.organization')}
                                </TableHead>
                                <TableHead className="text-right">
                                    <span className="sr-only">
                                        {t('super:errors.table.details')}
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {occurrences.data.map((occurrence) => (
                                <TableRow key={occurrence.id}>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {formatDate(occurrence.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={statusVariant(
                                                occurrence.status,
                                            )}
                                        >
                                            {occurrence.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-64 truncate font-mono text-xs">
                                        {occurrence.method} /{occurrence.path}
                                    </TableCell>
                                    <TableCell>
                                        {occurrence.organizationName ?? (
                                            <span className="text-muted-foreground">
                                                {t(
                                                    'super:errors.noOrganization',
                                                )}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={t(
                                                'super:errors.table.details',
                                            )}
                                            onClick={() =>
                                                setSelected(occurrence)
                                            }
                                        >
                                            <EyeIcon />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {occurrences.last_page > 1 && (
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            disabled={!occurrences.prev_page_url}
                            onClick={() =>
                                occurrences.prev_page_url &&
                                router.get(
                                    occurrences.prev_page_url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                        >
                            {t('super:errors.pagination.previous')}
                        </Button>
                        <span className="text-muted-foreground text-sm">
                            {t('super:errors.pagination.summary', {
                                current: occurrences.current_page,
                                last: occurrences.last_page,
                            })}
                        </span>
                        <Button
                            variant="outline"
                            disabled={!occurrences.next_page_url}
                            onClick={() =>
                                occurrences.next_page_url &&
                                router.get(
                                    occurrences.next_page_url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                        >
                            {t('super:errors.pagination.next')}
                        </Button>
                    </div>
                )}
            </div>

            <Dialog
                open={selected !== null}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {t('super:errors.detail.title')}
                                    <Badge
                                        variant={statusVariant(selected.status)}
                                    >
                                        {selected.status}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    {t('super:errors.detail.description', {
                                        method: selected.method,
                                        path: selected.path,
                                    })}
                                </DialogDescription>
                            </DialogHeader>

                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:errors.table.exception')}
                                    </dt>
                                    <dd className="font-mono break-all">
                                        {selected.exceptionClass ?? '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:errors.detail.message')}
                                    </dt>
                                    <dd className="break-words">
                                        {selected.message || '—'}
                                    </dd>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <dt className="text-muted-foreground text-xs">
                                            {t(
                                                'super:errors.table.organization',
                                            )}
                                        </dt>
                                        <dd>
                                            {selected.organizationName ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-xs">
                                            {t('super:errors.detail.user')}
                                        </dt>
                                        <dd>{selected.userName ?? '—'}</dd>
                                    </div>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:errors.detail.trace')}
                                    </dt>
                                    <dd>
                                        {selected.trace ? (
                                            <pre className="bg-muted mt-1 max-h-64 overflow-auto rounded-lg p-3 font-mono text-xs whitespace-pre-wrap">
                                                {selected.trace}
                                            </pre>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                {t(
                                                    'super:errors.detail.noTrace',
                                                )}
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => copyDetails(selected)}
                                >
                                    <CopyIcon />
                                    {t('super:errors.detail.copy')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
