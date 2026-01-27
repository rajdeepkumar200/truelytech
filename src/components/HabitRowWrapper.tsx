import { useAuth } from '@/contexts/AuthContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { LockedHabitOverlay } from './LockedHabitOverlay';

interface HabitRowWrapperProps {
    habitIndex: number;
    children: React.ReactNode;
    habitName?: string;
}

const MAX_FREE_HABITS = 5;

/**
 * Wrapper for habit rows that adds lock overlay for habits beyond the free limit
 * FREE TIER: First 5 habits are free
 * LOCKED: Habits 6+ show with blur and lock overlay
 */
export function HabitRowWrapper({ habitIndex, children, habitName }: HabitRowWrapperProps) {
    const { user } = useAuth();
    const entitlement = useEntitlement(user);

    // Check if this habit is locked (beyond free limit and user is locked)
    const isHabitLocked = entitlement.isLocked && habitIndex >= MAX_FREE_HABITS;

    if (!isHabitLocked) {
        return <>{children}</>;
    }

    // Render with lock overlay
    return (
        <div className="relative">
            {/* Render habit with blur */}
            <div className="pointer-events-none filter blur-[2px] opacity-40">
                {children}
            </div>

            {/* Lock overlay */}
            <LockedHabitOverlay habitName={habitName} />
        </div>
    );
}
