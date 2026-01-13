// Add Razorpay type to window
declare global {
  interface Window {
    Razorpay?: any;
  }
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useEntitlement } from '../hooks/useEntitlement';

export function PaywallPage() {
  const entitlement = useEntitlement();

  // Razorpay payment handler
  const openRazorpay = () => {
    const options = {
      key: 'rzp_test_YourKeyHere', // Replace with your Razorpay key
      amount: 10000, // 100 INR in paise
      currency: 'INR',
      name: 'TruelyTech',
      description: 'Premium Subscription',
      image: '/logo192.png',
      handler: function (response: { razorpay_payment_id: string }) {
        alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
        // You can add further logic here (e.g., API call to verify payment)
      },
      prefill: {
        name: '',
        email: '',
      },
      theme: {
        color: '#6366f1',
      },
    };
    // @ts-expect-error
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    // Load Razorpay script if not already loaded
    if (typeof window.Razorpay === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6">
        <h1 className="text-2xl font-bold mb-2">Premium Locked</h1>
        <p className="text-sm opacity-80">
          {entitlement.isInTrial
            ? `Your free trial has ${entitlement.trialDaysLeft} day${entitlement.trialDaysLeft === 1 ? '' : 's'} left.`
            : 'Your 7-day free trial has ended.'}
        </p>
        <p className="text-sm mt-2 opacity-90">
          Unlock premium to access advanced features like reminders, statistics, and more. Habits tracking stays free forever!
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={openRazorpay}>
            Pay ₹100 with Razorpay
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Back to Habits</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
