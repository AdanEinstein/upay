import { TimeColumns } from 'upay';

export const Columns = () => (
    <div className="w-fit rounded-2xl border p-3">
        <TimeColumns value="14:30" />
    </div>
);

export const ExpandedToParent = () => (
    <div className="h-72 w-fit rounded-2xl border p-3">
        <TimeColumns value="08:00" minuteStep={15} className="max-h-none" />
    </div>
);
