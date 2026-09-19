import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { create, destroy, edit } from '@/routes/super-admin/organizations';

type Organization = {
    id: number;
    name: string;
    slug: string;
    status: 'active' | 'suspended';
    usersCount: number;
};

type Props = {
    organizations: Organization[];
};

export default function Organizations({ organizations }: Props) {
    const { t } = useTranslation('super');

    const handleDelete = (organization: Organization) => {
        if (confirm(t('super:organizations.deleteConfirm'))) {
            router.delete(destroy(organization.id).url);
        }
    };

    return (
        <>
            <Head title={t('super:organizations.title')} />

            <div className="flex items-center justify-between">
                <Heading
                    title={t('super:organizations.heading')}
                    description={t('super:organizations.description')}
                />
                <Button asChild>
                    <Link href={create()}>{t('super:organizations.new')}</Link>
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('super:organizations.name')}</TableHead>
                        <TableHead>{t('super:organizations.slug')}</TableHead>
                        <TableHead>{t('super:organizations.status')}</TableHead>
                        <TableHead>{t('super:organizations.users')}</TableHead>
                        <TableHead className="text-right">
                            {t('super:organizations.actions')}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.map((organization) => (
                        <TableRow key={organization.id}>
                            <TableCell>{organization.name}</TableCell>
                            <TableCell className="font-mono text-sm">
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
                                    {organization.status === 'active'
                                        ? t('super:organizations.active')
                                        : t('super:organizations.suspended')}
                                </Badge>
                            </TableCell>
                            <TableCell>{organization.usersCount}</TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={edit(organization.id)}>
                                        {t('super:organizations.edit')}
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleDelete(organization)}
                                >
                                    {t('super:organizations.delete')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}
