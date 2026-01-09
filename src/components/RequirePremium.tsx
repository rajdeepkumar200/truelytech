import { Navigate, useLocation } from 'react-router-dom';
import { useEntitlement } from '../hooks/useEntitlement';

type Props = {
  children: React.ReactNode;
};

export function RequirePremium({ children }: Props) {
  const entitlement = useEntitlement();
  const location = useLocation();

  if (entitlement.isLocked) {
    return <Navigate to="/paywall" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
