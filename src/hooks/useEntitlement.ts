import { useEffect, useMemo, useState } from 'react';

const FIRST_RUN_KEY = 'habitex_firstRunAt';
const PAID_KEY = 'habitex_isPaid';
const PAID_AT_KEY = 'habitex_paidAt';

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

export type EntitlementState = {
  firstRunAt: number;
  isPaid: boolean;
  isInTrial: boolean;
  isLocked: boolean;
  trialDaysLeft: number;
};

function getOrInitFirstRunAt(): number {
  const existing = Number(localStorage.getItem(FIRST_RUN_KEY) ?? '0');
  if (Number.isFinite(existing) && existing > 0) return existing;
  const now = Date.now();
  localStorage.setItem(FIRST_RUN_KEY, String(now));
  return now;
}

function readIsPaid(): boolean {
  return localStorage.getItem(PAID_KEY) === '1';
}

export function markAsPaid(): void {
  localStorage.setItem(PAID_KEY, '1');
  localStorage.setItem(PAID_AT_KEY, String(Date.now()));
}

export function resetEntitlement(): void {
  localStorage.removeItem(PAID_KEY);
  localStorage.removeItem(PAID_AT_KEY);
  localStorage.removeItem(FIRST_RUN_KEY);
}

export function useEntitlement(): EntitlementState {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Keep trial countdown reasonably fresh (once per minute).
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    void tick;
    const firstRunAt = getOrInitFirstRunAt();
    const isPaid = readIsPaid();
    const trialEndsAt = firstRunAt + TRIAL_DAYS * DAY_MS;
    const now = Date.now();

    const isInTrial = now < trialEndsAt;
    const isLocked = !isPaid && !isInTrial;

    const msLeft = Math.max(0, trialEndsAt - now);
    const trialDaysLeft = isPaid ? 0 : Math.max(0, Math.ceil(msLeft / DAY_MS));

    return {
      firstRunAt,
      isPaid,
      isInTrial,
      isLocked,
      trialDaysLeft,
    };
  }, [tick]);
}
