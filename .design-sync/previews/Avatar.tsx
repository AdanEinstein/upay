import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
} from 'upay';

export const Sizes = () => (
    <div className="flex items-center gap-3">
        <Avatar size="sm">
            <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <Avatar>
            <AvatarFallback>JP</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
            <AvatarFallback>AC</AvatarFallback>
        </Avatar>
    </div>
);

export const WithBadge = () => (
    <Avatar size="lg">
        <AvatarFallback>RL</AvatarFallback>
        <AvatarBadge />
    </Avatar>
);

export const Group = () => (
    <AvatarGroup>
        <Avatar>
            <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <Avatar>
            <AvatarFallback>JP</AvatarFallback>
        </Avatar>
        <Avatar>
            <AvatarFallback>AC</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
);
