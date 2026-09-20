import { TimePicker } from 'upay';

export const OpenList = () => (
    <div className="h-[22rem] w-64">
        <TimePicker open value="14:30" />
    </div>
);

export const Empty = () => <TimePicker />;

export const Filled = () => <TimePicker value="09:15" />;

export const Disabled = () => <TimePicker disabled value="18:00" />;
