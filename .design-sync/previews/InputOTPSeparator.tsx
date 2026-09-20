import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'upay';

export const BetweenGroups = () => (
    <InputOTP maxLength={4} defaultValue="12">
        <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
        </InputOTPGroup>
    </InputOTP>
);
