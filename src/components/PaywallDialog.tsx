import { useMemo } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialDaysLeft?: number;
};

function getPaymentLinks() {
  // Optional: configure these in your env and redeploy
  // VITE_PAYMENT_URL_INR="https://..."
  // VITE_PAYMENT_URL_USD="https://..."
  const inr = import.meta.env.VITE_PAYMENT_URL_INR as string | undefined;
  const usd = import.meta.env.VITE_PAYMENT_URL_USD as string | undefined;
  return { inr, usd };
}

export function PaywallDialog({ open, onOpenChange, trialDaysLeft }: Props) {
  const { inr, usd } = useMemo(() => getPaymentLinks(), []);

  const description =
    typeof trialDaysLeft === 'number' && trialDaysLeft > 0
      ? `Your free trial has ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left. Habits stay free, but other features will lock after the trial unless you unlock.`
      : 'Your 7-day free trial has ended. Habits stay free, but other features are locked until you unlock.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock Premium</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2">
          {inr ? (
            <Button asChild>
              <a href={inr} target="_blank" rel="noreferrer">
                Pay ₹100
              </a>
            </Button>
          ) : null}

          {usd ? (
            <Button asChild variant="secondary">
              <a href={usd} target="_blank" rel="noreferrer">
                Pay $2
              </a>
            </Button>
          ) : null}

          {!inr && !usd ? (
            <p className="text-sm opacity-80">
              Payment links are not configured yet.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
