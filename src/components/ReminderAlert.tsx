import { useEffect, useState } from 'react';
import { Eye, Droplets, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderAlertProps {
  type: 'eye' | 'water' | null;
  onDismiss: () => void;
}

const ReminderAlert = ({ type, onDismiss }: ReminderAlertProps) => {
  const [blinkCount, setBlinkCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setIsVisible(true);
      setBlinkCount(0);
      
      // Blink animation - 3 times
      const blinkInterval = setInterval(() => {
        setBlinkCount(prev => {
          if (prev >= 5) { // 3 full blinks = 6 states (on/off/on/off/on/off)
            clearInterval(blinkInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 400);

      // Auto dismiss after 8 seconds
      const dismissTimeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 8000);

      return () => {
        clearInterval(blinkInterval);
        clearTimeout(dismissTimeout);
      };
    }
  }, [type, onDismiss]);

  if (!type) return null;

  const isEye = type === 'eye';
  const Icon = isEye ? Eye : Droplets;
  const title = isEye ? 'Eye Break!' : 'Hydration Time!';
  const message = isEye 
    ? 'Look away from the screen for 20 seconds. Blink slowly to rest your eyes.'
    : 'Take a sip of water to stay hydrated and energized.';
  
  const bgColor = isEye ? 'from-primary/20 to-primary/5' : 'from-accent/20 to-accent/5';
  const iconBgColor = isEye ? 'bg-primary/20' : 'bg-accent/20';
  const iconColor = isEye ? 'text-primary' : 'text-accent';
  const glowColor = isEye ? 'shadow-primary/50' : 'shadow-accent/50';
  const ringColor = isEye ? 'ring-primary/30' : 'ring-accent/30';
  
  // Blink effect - alternate between bright and normal
  const isBlinking = blinkCount % 2 === 0 && blinkCount < 6;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onDismiss}
    >
      <div 
        className={cn(
          "relative bg-gradient-to-br rounded-3xl p-8 max-w-sm w-full shadow-2xl transition-all duration-300 ring-2",
          bgColor,
          ringColor,
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
              iconBgColor,
              isBlinking && `shadow-2xl ${glowColor} scale-110`
            )}
            style={{
              animation: isBlinking ? 'pulse 0.4s ease-in-out' : 'none'
            }}
          >
            <Icon 
              className={cn(
                "transition-all duration-300",
                iconColor,
                isBlinking ? "w-14 h-14" : "w-12 h-12"
              )} 
            />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className={cn(
            "text-2xl font-bold mb-2",
            isEye ? "text-primary" : "text-accent"
          )}>
            {title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className={cn(
            "w-full mt-6 py-3 rounded-xl font-medium transition-all",
            isEye 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-accent text-accent-foreground hover:bg-accent/90"
          )}
        >
          Got it!
        </button>

        {/* Blinking indicator dots */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                Math.floor(blinkCount / 2) > i 
                  ? (isEye ? "bg-primary" : "bg-accent")
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReminderAlert;
