import { useLocation, useNavigate } from 'react-router-dom';
import { useEntitlement } from '../hooks/useEntitlement';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

type Props = {
  children: React.ReactNode;
};

/**
 * Wraps premium features to show locked overlay when trial ends
 * Shows blurred content with lock icon instead of hiding it
 */
export function RequirePremium({ children }: Props) {
  const { user } = useAuth();
  const entitlement = useEntitlement(user);
  const location = useLocation();
  const navigate = useNavigate();

  if (entitlement.isLocked) {
    return (
      <div className="relative">
        {/* Render children with blur */}
        <div className="pointer-events-none filter blur-sm opacity-50">
          {children}
        </div>

        {/* Lock overlay */}
        <div
          onClick={() => navigate('/paywall', { state: { from: location.pathname } })}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm cursor-pointer hover:bg-background/70 transition-colors rounded-lg group z-10"
        >
          <Lock className="h-12 w-12 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            Premium Feature Locked
          </p>
          <p className="text-sm text-muted-foreground mt-2 text-center px-4">
            Unlock all features for ₹250
          </p>
          <div className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Unlock Now
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
