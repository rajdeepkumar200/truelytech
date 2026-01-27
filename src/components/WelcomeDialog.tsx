import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Zap, AlertCircle } from 'lucide-react';

/**
 * Welcome dialog for trial users
 * Shows once per day during the 7-day trial
 * Offers option to continue trial or pay now for immediate access
 */
export function WelcomeDialog() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const entitlement = useEntitlement(user);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user || !entitlement.isInTrial || entitlement.isPaid) return;

        // Check if user has seen the welcome dialog today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastShown = localStorage.getItem(`welcome_shown_${user.id}`);

        if (lastShown !== today) {
            // Show dialog after a short delay for better UX
            const timer = setTimeout(() => {
                setOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user, entitlement.isInTrial, entitlement.isPaid]);

    const handleContinueTrial = () => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`welcome_shown_${user.id}`, today);
        }
        setOpen(false);
    };

    const handlePayNow = () => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`welcome_shown_${user.id}`, today);
        }
        setOpen(false);
        navigate('/paywall');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        {entitlement.trialDaysLeft === 7 ? 'Welcome to Habitency!' : 'Trial Reminder'}
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        {entitlement.trialDaysLeft === 7 ? (
                            <>You've unlocked a <span className="font-bold text-purple-600 dark:text-purple-400">7-day free trial</span> of all premium features!</>
                        ) : (
                            <>You have <span className="font-bold text-purple-600 dark:text-purple-400">{entitlement.trialDaysLeft} day{entitlement.trialDaysLeft !== 1 ? 's' : ''} left</span> in your free trial</>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">What's included:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>✨ Advanced habit analytics & statistics</li>
                            <li>🔔 Smart reminders & notifications</li>
                            <li>⏱️ Pomodoro timer with focus mode</li>
                            <li>📊 Weekly reports & goal tracking</li>
                            <li>📝 Personal journal & reflections</li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-3 rounded-lg border border-purple-500/20">
                        <p className="text-xs text-center">
                            Upgrade to <span className="font-bold">focus mode</span> for just <span className="font-bold text-purple-600 dark:text-purple-400">₹250</span> to keep premium features forever
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                        <Button
                            onClick={handleContinueTrial}
                            size="lg"
                            variant="default"
                            className="w-full"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Continue Free Trial
                        </Button>

                        <Button
                            onClick={handlePayNow}
                            size="lg"
                            variant="outline"
                            className="w-full border-purple-500/50 hover:bg-purple-500/10"
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            Pay Now - ₹250
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Habit tracking stays free forever! 🎉
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Trial ended dialog
 * Shows after the 7-day trial ends to motivate user to pay
 */
export function TrialEndedDialog() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const entitlement = useEntitlement(user);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user || entitlement.isInTrial || entitlement.isPaid) return;

        // Only show if trial has ended (user is locked)
        if (entitlement.isLocked) {
            // Check if shown today
            const today = new Date().toISOString().split('T')[0];
            const lastShown = localStorage.getItem(`trial_ended_shown_${user.id}`);

            if (lastShown !== today) {
                const timer = setTimeout(() => {
                    setOpen(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, entitlement.isInTrial, entitlement.isPaid, entitlement.isLocked]);

    const handlePayNow = () => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`trial_ended_shown_${user.id}`, today);
        }
        setOpen(false);
        navigate('/paywall');
    };

    const handleMaybeLater = () => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`trial_ended_shown_${user.id}`, today);
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <AlertCircle className="h-6 w-6 text-orange-500" />
                        Your Free Trial Has Ended
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Continue your journey to better habits with <span className="font-bold text-purple-600 dark:text-purple-400">Focus Mode</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <p className="text-sm">You've experienced the power of premium features. Don't lose your momentum!</p>

                        <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                            <p className="text-sm font-semibold text-center">
                                🚨 Premium features are now locked
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">What you'll lose access to:</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>❌ Advanced analytics & insights</li>
                                <li>❌ Smart reminders & notifications</li>
                                <li>❌ Pomodoro focus timer</li>
                                <li>❌ Weekly reports & goals</li>
                                <li>❌ Personal journal</li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-lg border border-purple-500/20">
                            <p className="text-sm text-center font-semibold">
                                Unlock everything for just <span className="text-purple-600 dark:text-purple-400 text-lg">₹250</span>
                            </p>
                            <p className="text-xs text-center mt-1 text-muted-foreground">One-time payment • Lifetime access</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                        <Button
                            onClick={handlePayNow}
                            size="lg"
                            variant="default"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            Pay Now & Continue
                        </Button>

                        <Button
                            onClick={handleMaybeLater}
                            size="sm"
                            variant="ghost"
                            className="w-full"
                        >
                            Maybe Later
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        ✨ Basic habit tracking is still free!
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
