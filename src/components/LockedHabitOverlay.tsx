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
            <Lock className="h-6 w-6 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Unlock Premium
            </p>
        </Link>
    );
}
