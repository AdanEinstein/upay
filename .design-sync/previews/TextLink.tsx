import { TextLink } from 'upay';

export const Inline = () => (
    <p className="text-muted-foreground text-sm">
        Ainda não tem conta? <TextLink href="/cadastro">Cadastre-se</TextLink>
    </p>
);

export const Standalone = () => (
    <TextLink href="/esqueci-a-senha">Esqueci minha senha</TextLink>
);
