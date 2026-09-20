import { Calendar } from 'upay';

const setembro = new Date(2026, 8, 1);

export const Single = () => (
    <div className="w-fit rounded-2xl border p-3">
        <Calendar defaultMonth={setembro} selected={new Date(2026, 8, 20)} />
    </div>
);

export const Range = () => (
    <div className="w-fit rounded-2xl border p-3">
        <Calendar mode="range" defaultMonth={setembro} selected={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 15) }} />
    </div>
);

export const WeekendsDisabled = () => (
    <div className="w-fit rounded-2xl border p-3">
        <Calendar
            defaultMonth={setembro}
            weekStartsOn={1}
            selected={new Date(2026, 8, 10)}
            disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
        />
    </div>
);
