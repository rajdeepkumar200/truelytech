import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LockedHabitOverlayProps {
    habitName?: string;
}

/**
 * Overlay shown on locked habits (habits 6+)
 * Displays blurred habit with lock icon
 */
export function LockedHabitOverlay({ habitName }: LockedHabitOverlayProps) {
    return (
        <Link
            to="/paywall"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm cursor-pointer hover:bg-background/70 transition-colors rounded-lg group"
        >
            <Lock className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                Unlock Premium
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                ₹250 for unlimited habits
            </p>
        </Link>
    );
}
