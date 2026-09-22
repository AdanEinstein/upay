import { Form, Head, router } from '@inertiajs/react';
import {
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import OrganizationController from '@/actions/App/Http/Controllers/Super/OrganizationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { destroy } from '@/routes/super-admin/organizations';
import { update as updateStatus } from '@/routes/super-admin/organizations/status';
import { update as updateSubscription } from '@/routes/super-admin/organizations/subscription';

type Status = 'active' | 'suspended';

type Organization = {
    id: number;
    name: string;
    slug: string;
    status: Status;
    suspensionReason: string | null;
    createdAt: string;
    plan: { id: number; name: string; cycle: 'monthly' | 'annual' } | null;
    pastDue: boolean;
    owner: { name: string; email: string } | null;
    usersCount: number;
    customersCount: number;
    productsCount: number;
    salesMonthCount: number;
};

type Plan = { id: number; name: string };

type Props = {
    organizations: Organization[];
    plans: Plan[];
    statuses: Status[];
    kpis: {
        total: number;
        active: number;
        suspended: number;
        users: number;
        pastDue: number;
    };
};

type Filter = 'all' | 'active' | 'suspended' | 'pastDue';

const FILTERS: Filter[] = ['all', 'active', 'suspended', 'pastDue'];

function displayStatus(
    organization: Organization,
): 'active' | 'suspended' | 'pastDue' {
    if (organization.status === 'suspended') {
        return 'suspended';
    }

    return organization.pastDue ? 'pastDue' : 'active';
}

function StatusBadge({ organization }: { organization: Organization }) {
    const { t } = useTranslation('super');
    const status = displayStatus(organization);

    return (
        <Badge
            variant={
                status === 'active'
                    ? 'default'
                    : status === 'pastDue'
                      ? 'destructive'
                      : 'secondary'
            }
        >
            {t(`organizations.${status}`)}
        </Badge>
    );
}

// `null` = closed, `'create'` = new organization, an Organization = editing it.
type DialogState = null | 'create' | Organization;

function OrganizationDialog({
    state,
    statuses,
    onClose,
}: {
    state: DialogState;
    statuses: Status[];
    onClose: () => void;
}) {
    const { t } = useTranslation(['super', 'common']);
    const editing = state !== null && state !== 'create' ? state : null;

    const form = editing
        ? OrganizationController.update.form(editing.id)
        : OrganizationController.store.form();

    return (
        <Dialog
            open={state !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? t('super:organizations.dialog.editTitle')
                            : t('super:organizations.dialog.createTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? t('super:organizations.dialog.editDescription')
                            : t('super:organizations.dialog.createDescription')}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    // Remount per target so defaultValue and errors never leak between organizations.
                    key={editing?.id ?? 'create'}
                    {...form}
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        toast.success(
                            editing
                                ? t('super:organizations.toast.updated')
                                : t('super:organizations.toast.created'),
                        );
                        onClose();
                    }}
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    {t('super:organizations.name')}
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={editing?.name}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug">
                                    {t('super:organizations.slug')}
                                </Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    defaultValue={editing?.slug}
                                    required
                                />
                                <InputError message={errors.slug} />
                            </div>

                            {editing && (
                                <div className="grid gap-2">
                                    <Label htmlFor="status">
                                        {t('super:organizations.status')}
                                    </Label>
                                    <Select
                                        name="status"
                                        defaultValue={editing.status}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {t(
                                                        `super:organizations.${status}`,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            )}

                            {!editing && (
                                <fieldset className="space-y-4 border-t pt-4">
                                    <legend className="text-sm font-medium">
                                        {t(
                                            'super:organizations.dialog.adminSection',
                                        )}
                                    </legend>

                                    <div className="grid gap-2">
                                        <Label htmlFor="admin_name">
                                            {t(
                                                'super:organizations.dialog.adminName',
                                            )}
                                        </Label>
                                        <Input
                                            id="admin_name"
                                            name="admin_name"
                                            autoComplete="off"
                                            required
                                        />
                                        <InputError
                                            message={errors.admin_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="admin_email">
                                            {t(
                                                'super:organizations.dialog.adminEmail',
                                            )}
                                        </Label>
                                        <Input
                                            id="admin_email"
                                            name="admin_email"
                                            type="email"
                                            autoComplete="off"
                                            required
                                        />
                                        <InputError
                                            message={errors.admin_email}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="admin_password">
                                            {t(
                                                'super:organizations.dialog.adminPassword',
                                            )}
                                        </Label>
                                        <PasswordInput
                                            id="admin_password"
                                            name="admin_password"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <InputError
                                            message={errors.admin_password}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="admin_password_confirmation">
                                            {t(
                                                'super:organizations.dialog.adminPasswordConfirmation',
                                            )}
                                        </Label>
                                        <PasswordInput
                                            id="admin_password_confirmation"
                                            name="admin_password_confirmation"
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                </fieldset>
                            )}

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        {t('common:cancel')}
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {editing
                                        ? t('common:save')
                                        : t(
                                              'super:organizations.dialog.create',
                                          )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteDialog({
    organization,
    onClose,
}: {
    organization: Organization | null;
    onClose: () => void;
}) {
    const { t } = useTranslation(['super', 'common']);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        if (!organization) {
            return;
        }

        router.delete(destroy(organization.id).url, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onSuccess: () => {
                toast.success(t('super:organizations.toast.deleted'));
                onClose();
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog
            open={organization !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('super:organizations.deleteDialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('super:organizations.deleteDialog.description', {
                            name: organization?.name ?? '',
                        })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t('common:cancel')}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={processing}
                        onClick={confirmDelete}
                    >
                        {t('super:organizations.deleteDialog.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OrganizationDetail({
    organization,
    plans,
    onClose,
}: {
    organization: Organization | null;
    plans: Plan[];
    onClose: () => void;
}) {
    const { t } = useTranslation(['super', 'common']);
    const [planId, setPlanId] = useState(String(organization?.plan?.id ?? ''));
    const [cycle, setCycle] = useState<string>(
        organization?.plan?.cycle ?? 'monthly',
    );
    const [blocking, setBlocking] = useState(false);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!organization) {
        return null;
    }

    const send = (
        url: string,
        data: Record<string, string | number | null>,
        message: string,
        after?: () => void,
    ) =>
        router.put(url, data, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onSuccess: () => {
                toast.success(message);
                after?.();
            },
            onFinish: () => setProcessing(false),
        });

    const usage = [
        {
            label: t('super:organizations.detail.customers'),
            value: organization.customersCount,
        },
        {
            label: t('super:organizations.detail.products'),
            value: organization.productsCount,
        },
        {
            label: t('super:organizations.detail.salesMonth'),
            value: organization.salesMonthCount,
        },
    ];

    return (
        <>
            <Sheet open onOpenChange={(open) => !open && onClose()}>
                <SheetContent className="overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{organization.name}</SheetTitle>
                        <SheetDescription>
                            {t('super:organizations.detail.description')}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5 px-6 pb-6">
                        <div className="flex items-center gap-2">
                            <StatusBadge organization={organization} />
                            <span className="text-muted-foreground text-sm">
                                {organization.slug}
                            </span>
                        </div>

                        {organization.status === 'suspended' &&
                            organization.suspensionReason && (
                                <p className="bg-muted rounded-lg p-3 text-sm">
                                    {t(
                                        'super:organizations.detail.blockedReason',
                                        {
                                            reason:
                                                organization.suspensionReason ===
                                                'billing_overdue'
                                                    ? t(
                                                          'super:organizations.detail.billingOverdue',
                                                      )
                                                    : organization.suspensionReason,
                                        },
                                    )}
                                </p>
                            )}

                        <dl className="grid gap-1 text-sm">
                            <dt className="text-muted-foreground">
                                {t('super:organizations.detail.owner')}
                            </dt>
                            <dd className="font-medium">
                                {organization.owner?.name ?? '—'}
                            </dd>
                            <dd className="text-muted-foreground">
                                {organization.owner?.email}
                            </dd>
                        </dl>

                        <div className="grid gap-2">
                            <Label htmlFor="plan">
                                {organization.plan
                                    ? t('super:organizations.detail.changePlan')
                                    : t(
                                          'super:organizations.detail.selectPlan',
                                      )}
                            </Label>
                            {organization.plan && (
                                <p className="text-muted-foreground text-sm">
                                    {t(
                                        'super:organizations.detail.currentPlan',
                                    )}
                                    : {organization.plan.name}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Select
                                    value={planId}
                                    onValueChange={setPlanId}
                                >
                                    <SelectTrigger id="plan" className="flex-1">
                                        <SelectValue
                                            placeholder={t(
                                                'super:organizations.detail.selectPlan',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => (
                                            <SelectItem
                                                key={plan.id}
                                                value={String(plan.id)}
                                            >
                                                {plan.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={cycle} onValueChange={setCycle}>
                                    <SelectTrigger
                                        id="cycle"
                                        aria-label={t(
                                            'super:organizations.detail.cycle',
                                        )}
                                        className="w-32"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">
                                            {t('super:billing.cycle.monthly')}
                                        </SelectItem>
                                        <SelectItem value="annual">
                                            {t('super:billing.cycle.annual')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="secondary"
                                    disabled={
                                        processing ||
                                        planId === '' ||
                                        (planId ===
                                            String(organization.plan?.id) &&
                                            cycle === organization.plan?.cycle)
                                    }
                                    onClick={() =>
                                        send(
                                            updateSubscription(organization.id)
                                                .url,
                                            {
                                                plan_id: Number(planId),
                                                billing_cycle: cycle,
                                            },
                                            t(
                                                'super:organizations.toast.planChanged',
                                            ),
                                        )
                                    }
                                >
                                    {t('super:organizations.detail.savePlan')}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {usage.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border p-3"
                                >
                                    <p className="text-muted-foreground text-xs">
                                        {item.label}
                                    </p>
                                    <p className="text-lg font-semibold tabular-nums">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {organization.status === 'suspended' ? (
                            <Button
                                className="w-full"
                                disabled={processing}
                                onClick={() =>
                                    send(
                                        updateStatus(organization.id).url,
                                        { status: 'active' },
                                        t(
                                            'super:organizations.toast.activated',
                                        ),
                                    )
                                }
                            >
                                {t('super:organizations.detail.activate')}
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setBlocking(true)}
                            >
                                {t('super:organizations.detail.block')}
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={blocking} onOpenChange={setBlocking}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('super:organizations.blockDialog.title', {
                                name: organization.name,
                            })}
                        </DialogTitle>
                        <DialogDescription>
                            {t('super:organizations.blockDialog.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">
                            {t('super:organizations.blockDialog.reason')}
                        </Label>
                        <Input
                            id="reason"
                            value={reason}
                            maxLength={500}
                            onChange={(event) => setReason(event.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t('common:cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={processing}
                            onClick={() =>
                                send(
                                    updateStatus(organization.id).url,
                                    {
                                        status: 'suspended',
                                        reason: reason || null,
                                    },
                                    t('super:organizations.toast.blocked'),
                                    () => {
                                        setBlocking(false);
                                        setReason('');
                                    },
                                )
                            }
                        >
                            {t('super:organizations.blockDialog.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function Organizations({
    organizations,
    plans,
    statuses,
    kpis,
}: Props) {
    const { t } = useTranslation(['super', 'common']);
    const { i18n } = useTranslation();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [dialog, setDialog] = useState<DialogState>(null);
    const [pendingDelete, setPendingDelete] = useState<Organization | null>(
        null,
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return organizations.filter(
            (organization) =>
                (filter === 'all' ||
                    (filter === 'pastDue'
                        ? organization.pastDue
                        : organization.status === filter)) &&
                (term === '' ||
                    organization.name.toLowerCase().includes(term) ||
                    organization.slug.toLowerCase().includes(term)),
        );
    }, [organizations, search, filter]);

    const selected =
        organizations.find((organization) => organization.id === selectedId) ??
        null;

    const stats = [
        { label: t('super:organizations.kpi.total'), value: kpis.total },
        { label: t('super:organizations.kpi.active'), value: kpis.active },
        {
            label: t('super:organizations.kpi.suspended'),
            value: kpis.suspended,
        },
        { label: t('super:organizations.kpi.pastDue'), value: kpis.pastDue },
        { label: t('super:organizations.kpi.users'), value: kpis.users },
    ];

    return (
        <>
            <Head title={t('super:organizations.title')} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('super:organizations.heading')}
                        description={t('super:organizations.description')}
                    />
                    <Button onClick={() => setDialog('create')}>
                        <PlusIcon />
                        {t('super:organizations.new')}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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

                <div className="relative max-w-sm">
                    <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('super:organizations.search')}
                        aria-label={t('super:organizations.search')}
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((item) => (
                        <button
                            key={item}
                            type="button"
                            aria-pressed={filter === item}
                            onClick={() => setFilter(item)}
                            className={cn(
                                'focus-visible:ring-ring/50 rounded-full px-3.5 py-2 text-[13px] outline-none focus-visible:ring-[3px]',
                                filter === item
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'bg-muted text-muted-foreground font-medium',
                            )}
                        >
                            {t(`super:organizations.filters.${item}`)}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                        {organizations.length === 0
                            ? t('super:organizations.empty')
                            : t('super:organizations.noResults')}
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    {t('super:organizations.name')}
                                </TableHead>
                                <TableHead>
                                    {t('super:organizations.plan')}
                                </TableHead>
                                <TableHead>
                                    {t('super:organizations.status')}
                                </TableHead>
                                <TableHead>
                                    {t('super:organizations.since')}
                                </TableHead>
                                <TableHead className="text-right">
                                    {t('super:organizations.users')}
                                </TableHead>
                                <TableHead className="text-right">
                                    {t('super:organizations.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((organization) => (
                                <TableRow key={organization.id}>
                                    <TableCell className="font-medium">
                                        {organization.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {organization.plan?.name ??
                                            t('super:organizations.noPlan')}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            organization={organization}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(
                                            `${organization.createdAt}T00:00:00`,
                                        ).toLocaleDateString(
                                            i18n.resolvedLanguage,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {organization.usersCount}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t(
                                                    'super:organizations.view',
                                                )}
                                                onClick={() =>
                                                    setSelectedId(
                                                        organization.id,
                                                    )
                                                }
                                            >
                                                <EyeIcon />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t(
                                                    'super:organizations.edit',
                                                )}
                                                onClick={() =>
                                                    setDialog(organization)
                                                }
                                            >
                                                <PencilSimpleIcon />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t(
                                                    'super:organizations.delete',
                                                )}
                                                onClick={() =>
                                                    setPendingDelete(
                                                        organization,
                                                    )
                                                }
                                            >
                                                <TrashIcon />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <OrganizationDialog
                state={dialog}
                statuses={statuses}
                onClose={() => setDialog(null)}
            />
            <OrganizationDetail
                key={selected?.id ?? 'none'}
                organization={selected}
                plans={plans}
                onClose={() => setSelectedId(null)}
            />
            <DeleteDialog
                organization={pendingDelete}
                onClose={() => setPendingDelete(null)}
            />
        </>
    );
}
