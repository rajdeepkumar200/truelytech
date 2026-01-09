import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useEntitlement } from '../hooks/useEntitlement';

function getPaymentLinks() {
  const inr = import.meta.env.VITE_PAYMENT_URL_INR as string | undefined;
  const usd = import.meta.env.VITE_PAYMENT_URL_USD as string | undefined;
  return { inr, usd };
}

export function PaywallPage() {
  const entitlement = useEntitlement();
  const { inr, usd } = useMemo(() => getPaymentLinks(), []);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-bold">Premium Locked</h1>
        <p className="mt-2 text-sm opacity-80">
          {entitlement.isInTrial
            ? `Your free trial has ${entitlement.trialDaysLeft} day${entitlement.trialDaysLeft === 1 ? '' : 's'} left.`
            : 'Your 7-day free trial has ended.'}{' '}
          Habits stay free. Unlock premium to use other features.
        </p>

        <div className="mt-4 flex flex-col gap-2">
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
          <Button asChild variant="ghost">
            <Link to="/">Back to Habits</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
