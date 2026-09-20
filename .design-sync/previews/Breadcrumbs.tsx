import { Breadcrumbs } from 'upay';

export const Trail = () => (
    <Breadcrumbs
        breadcrumbs={[
            { title: 'Painel', href: '/loja-exemplo/dashboard' },
            { title: 'Clientes', href: '/loja-exemplo/clientes' },
            { title: 'Maria Souza', href: '/loja-exemplo/clientes/1' },
        ]}
    />
);
