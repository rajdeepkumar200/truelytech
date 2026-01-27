import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Zap } from 'lucide-react';

/**
 * Welcome dialog for new users
 * Shows once after account creation to explain the 7-day trial
 * Offers option to start trial or pay now for immediate access
 */
export function WelcomeDialog() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Check if user has seen the welcome dialog
        const hasSeenWelcome = localStorage.getItem(`welcome_shown_${user.id}`);

        if (!hasSeenWelcome) {
            // Show dialog after a short delay for better UX
            const timer = setTimeout(() => {
                setOpen(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleStartTrial = () => {
        if (user) {
            localStorage.setItem(`welcome_shown_${user.id}`, 'true');
        }
        setOpen(false);
    };

    const handlePayNow = () => {
        if (user) {
            localStorage.setItem(`welcome_shown_${user.id}`, 'true');
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
                        Welcome to Habitency!
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        You've unlocked a <span className="font-bold text-purple-600 dark:text-purple-400">7-day free trial</span> of all premium features!
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
                            After 7 days, upgrade to <span className="font-bold">focus mode</span> for just <span className="font-bold text-purple-600 dark:text-purple-400">₹250</span> to keep premium features
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                        <Button
                            onClick={handleStartTrial}
                            size="lg"
                            variant="default"
                            className="w-full"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Start Free Trial
                        </Button>

                        <Button
                            onClick={handlePayNow}
                            size="lg"
                            variant="outline"
                            className="w-full border-purple-500/50 hover:bg-purple-500/10"
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            Pay Now for Focus Mode - ₹250
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
