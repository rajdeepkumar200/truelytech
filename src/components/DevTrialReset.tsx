import { resetEntitlement } from '@/hooks/useEntitlement';

/**
 * DEV ONLY: Helper component to reset trial for testing
 * This allows you to reset the trial period and test the paywall flow
 * Only visible in development mode
 */
export function DevTrialReset() {
    const handleReset = () => {
        resetEntitlement();
        alert('Trial reset! Refreshing page...');
        window.location.reload();
    };

    // Only show in development mode
    const isDev = import.meta.env.DEV;

    if (!isDev) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-black p-2 rounded-lg shadow-lg">
            <div className="text-xs font-bold mb-1">🔧 DEV TOOLS</div>
            <button
                onClick={handleReset}
                className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-100"
            >
                Reset Trial Period
            </button>
        </div>
    );
}

