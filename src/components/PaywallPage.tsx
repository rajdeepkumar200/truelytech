// Add Razorpay type to window
declare global {
  interface Window {
    Razorpay?: any;
  }
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useEntitlement, markAsPaid } from '../hooks/useEntitlement';
import { useAuth } from '../contexts/AuthContext';

export function PaywallPage() {
  const { user } = useAuth();
  const entitlement = useEntitlement(user);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Get Razorpay key from environment variables
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // Razorpay payment handler
  const openRazorpay = () => {
    if (!scriptLoaded || !window.Razorpay) {
      alert('Razorpay is not loaded yet. Please try again in a moment.');
      return;
    }

    if (!razorpayKey) {
      alert('Payment configuration is not set up. Please contact support.');
      return;
    }

    const options = {
      key: razorpayKey,
      amount: 10000, // 100 INR in paise
      currency: 'INR',
      name: 'TruelyTech',
      description: 'Premium Subscription',
      image: '/truelytech-logo.svg',
      handler: function (response: { razorpay_payment_id: string }) {
        console.log('Payment successful:', response);
        alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
        // Mark user as paid to unlock premium features
        markAsPaid();
        // You can add further logic here (e.g., API call to verify payment on backend)
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal dismissed');
        }
      },
      prefill: {
        name: '',
        email: '',
      },
      theme: {
        color: '#6366f1',
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      alert('Failed to open payment gateway. Please try again.');
    }
  };

  useEffect(() => {
    // Load Razorpay script if not already loaded
    if (typeof window.Razorpay === 'undefined') {
      setIsScriptLoading(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setScriptLoaded(true);
        setIsScriptLoading(false);
      };

      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setIsScriptLoading(false);
        alert('Failed to load payment gateway. Please check your internet connection and try again.');
      };

      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
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
          <Button
            onClick={openRazorpay}
            className="mx-auto w-40"
            size="lg"
            variant="primary"
            disabled={isScriptLoading || !razorpayKey}
          >
            {isScriptLoading ? 'Loading...' : 'Pay Now'}
          </Button>

          {!razorpayKey && (
            <p className="text-xs text-center opacity-70 text-destructive">
              Payment gateway not configured
            </p>
          )}
          {/* Only show Back to Habits if user is not locked out */}
          {entitlement.isInTrial || entitlement.isPaid ? (
            <Button asChild variant="ghost">
              <Link to="/">Back to Habits</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
