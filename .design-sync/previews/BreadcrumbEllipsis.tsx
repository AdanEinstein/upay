import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from 'upay';

export const InTrail = () => (
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#">Início</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Vendas</BreadcrumbLink></BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
);
