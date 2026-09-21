import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from 'upay';

export const Open = () => (
    <div className="h-56 w-[30rem]">
        <NavigationMenu defaultValue="cadastros">
            <NavigationMenuList>
                <NavigationMenuItem value="cadastros">
                    <NavigationMenuTrigger>Cadastros</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-64 gap-1 p-1">
                            <li>
                                <NavigationMenuLink href="#">
                                    Clientes
                                </NavigationMenuLink>
                            </li>
                            <li>
                                <NavigationMenuLink href="#">
                                    Produtos
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href="#" className="px-3 py-2 text-sm">
                        Vendas
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    </div>
);
