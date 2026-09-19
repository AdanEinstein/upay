import { Form, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import OrganizationController from '@/actions/App/Http/Controllers/Super/OrganizationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OrganizationCreate() {
    const { t } = useTranslation(['super', 'common']);

    return (
        <>
            <Head title={t('super:organizations.create.title')} />

            <Heading
                title={t('super:organizations.create.heading')}
                description={t('super:organizations.create.description')}
            />

            <Form
                {...OrganizationController.store.form()}
                className="max-w-md space-y-6"
            >
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                {t('super:organizations.name')}
                            </Label>
                            <Input id="name" name="name" required autoFocus />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="slug">
                                {t('super:organizations.slug')}
                            </Label>
                            <Input id="slug" name="slug" required />
                            <InputError message={errors.slug} />
                        </div>

                        <Button disabled={processing}>
                            {t('common:save')}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
