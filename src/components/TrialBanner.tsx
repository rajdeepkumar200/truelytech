import { useAuth } from '@/contexts/AuthContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

/**
 * Trial countdown banner that appears during the 7-day trial period
 * Shows days remaining, and hours on the last day
 */
export function TrialBanner() {
    const { user } = useAuth();
    const entitlement = useEntitlement(user);
    const navigate = useNavigate();
    const location = useLocation();
    const [, setTick] = useState(0);

    // Update every minute to keep countdown fresh
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Hide on the install page
    if (location.pathname === '/install') {
        return null;
    }

    // Don't show if not in trial or if paid
    if (!entitlement.isInTrial || entitlement.isPaid) {
        return null;
    }

    // Calculate hours remaining for last day
    const now = Date.now();
    const trialEndsAt = entitlement.firstRunAt + (7 * 24 * 60 * 60 * 1000);
    const msRemaining = trialEndsAt - now;
    const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));

    const isLastDay = entitlement.trialDaysLeft === 1;

    return (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-purple-500/20">
            <div className="container mx-auto px-4 py-2">
                <div className="flex items-center justify-between gap-4 flex-wrap pr-24 sm:pr-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                            {isLastDay ? (
                                <>
                                    <Clock className="inline h-3 w-3 mr-1" />
                                    <span className="text-orange-500 font-bold">
                                        {hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''} left
                                    </span> in your free trial
                                </>
                            ) : (
                                <>
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                                        {entitlement.trialDaysLeft} day{entitlement.trialDaysLeft !== 1 ? 's' : ''} left
                                    </span> in your free trial
                                </>
                            )}
                        </span>
                    </div>
                    <Button onClick={() => navigate('/paywall')} size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 flex-shrink-0">
                        Pay Now - ₹250
                    </Button>
                </div>
            </div>
        </div>
    );
}
