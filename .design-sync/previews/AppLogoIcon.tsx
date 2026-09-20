import { AppLogoIcon } from 'upay';

export const Sizes = () => (
    <div className="flex items-center gap-4">
        <AppLogoIcon className="size-5 fill-current" />
        <AppLogoIcon className="size-8 fill-current" />
        <AppLogoIcon className="size-12 fill-current" />
    </div>
);

export const OnBrand = () => (
    <div className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-2xl">
        <AppLogoIcon className="size-8 fill-current" />
    </div>
);
