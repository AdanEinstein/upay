import { DateTimePicker } from 'upay';

export const OpenPicker = () => (
    <div className="h-[26rem] w-[40rem]">
        <DateTimePicker open value={new Date(2026, 8, 20, 14, 30)} />
    </div>
);

export const Empty = () => <DateTimePicker />;

export const Filled = () => (
    <DateTimePicker value={new Date(2026, 8, 20, 14, 30)} />
);
