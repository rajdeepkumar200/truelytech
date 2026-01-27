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
  const [isVerifying, setIsVerifying] = useState(false);

  // Get Razorpay key from environment variables
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // Verify payment on backend
  const verifyPayment = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature: string;
  }) => {
    try {
      setIsVerifying(true);

      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Payment verified successfully:', result.payment_id);
        markAsPaid();
        alert('Payment verified! Premium features unlocked. 🎉');
      } else {
        console.error('Payment verification failed:', result.error);
        alert('Payment verification failed. Please contact support with Payment ID: ' + paymentData.razorpay_payment_id);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error verifying payment. Please contact support.');
    } finally {
      setIsVerifying(false);
    }
  };

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
      amount: 25000, // 250 INR in paise
      currency: 'INR',
      name: 'TruelyTech',
      description: 'Premium Subscription',
      image: '/truelytech-logo.svg',
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature: string;
      }) {
        console.log('Payment response received:', response);
        // Verify payment on backend before unlocking features
        await verifyPayment(response);
      },
      modal: {
        ondismiss: function () {
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
            variant="default"
            disabled={isScriptLoading || !razorpayKey || isVerifying}
          >
            {isVerifying ? 'Verifying...' : isScriptLoading ? 'Loading...' : 'Pay Now'}
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
