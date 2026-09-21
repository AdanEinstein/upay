import { DatePicker } from 'upay';

export const OpenCalendar = () => (
    <div className="h-[26rem] w-80">
        <DatePicker open value={new Date(2026, 8, 20)} />
    </div>
);

export const Empty = () => <DatePicker />;

export const Filled = () => <DatePicker value={new Date(2026, 8, 20)} />;

export const Disabled = () => (
    <DatePicker disabled value={new Date(2026, 9, 10)} />
);
