import { Form, Head, router } from '@inertiajs/react';
import {
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy } from '@/routes/super-admin/organizations';

type Status = 'active' | 'suspended';

type Organization = {
    id: number;
    name: string;
    slug: string;
    status: Status;
    usersCount: number;
};

type Props = {
    organizations: Organization[];
    statuses: Status[];
    kpis: { total: number; active: number; suspended: number; users: number };
};

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

export default function Organizations({
    organizations,
    statuses,
    kpis,
}: Props) {
    const { t } = useTranslation(['super', 'common']);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState<DialogState>(null);
    const [pendingDelete, setPendingDelete] = useState<Organization | null>(
        null,
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return term === ''
            ? organizations
            : organizations.filter(
                  (organization) =>
                      organization.name.toLowerCase().includes(term) ||
                      organization.slug.toLowerCase().includes(term),
              );
    }, [organizations, search]);

    const stats = [
        { label: t('super:organizations.kpi.total'), value: kpis.total },
        { label: t('super:organizations.kpi.active'), value: kpis.active },
        {
            label: t('super:organizations.kpi.suspended'),
            value: kpis.suspended,
        },
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

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                                    {t('super:organizations.slug')}
                                </TableHead>
                                <TableHead>
                                    {t('super:organizations.status')}
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
                                        {organization.slug}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                organization.status === 'active'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {t(
                                                `super:organizations.${organization.status}`,
                                            )}
                                        </Badge>
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
            <DeleteDialog
                organization={pendingDelete}
                onClose={() => setPendingDelete(null)}
            />
        </>
    );
}
