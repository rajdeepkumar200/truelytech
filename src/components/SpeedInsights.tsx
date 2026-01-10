import { SpeedInsights as SpeedInsightsComponent } from '@vercel/speed-insights/react';

/**
 * SpeedInsights component for Vite + React projects.
 * Wraps the Vercel Speed Insights tracking component.
 * Automatically disabled in Capacitor (Android) environment.
 */
export default function SpeedInsights() {
  // Only render on the client side and outside of Capacitor (Android) environment
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isCapacitorNative = (window as any)?.Capacitor?.isNativePlatform?.() === true;
    if (isCapacitorNative) {
      return null;
    }
  }

  return <SpeedInsightsComponent />;
}
