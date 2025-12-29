import { ReactNode } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface SwipeableItemProps {
  children: ReactNode;
  onComplete: () => void;
  onDelete: () => void;
  className?: string;
}

const SwipeableItem = ({ children, onComplete, onDelete, className }: SwipeableItemProps) => {
  const { swipeOffset, handlers } = useSwipeGesture({
    onSwipeRight: onComplete,
    onSwipeLeft: onDelete,
    threshold: 80,
  });

  const showComplete = swipeOffset > 40;
  const showDelete = swipeOffset < -40;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Actions */}
      <div className="absolute inset-0 flex">
        {/* Complete action (swipe right) */}
        <div 
          className={cn(
            "flex items-center justify-start pl-4 w-1/2 bg-accent transition-opacity",
            showComplete ? "opacity-100" : "opacity-0"
          )}
        >
          <Check className="w-5 h-5 text-accent-foreground" />
        </div>
        
        {/* Delete action (swipe left) */}
        <div 
          className={cn(
            "flex items-center justify-end pr-4 w-1/2 bg-destructive transition-opacity ml-auto",
            showDelete ? "opacity-100" : "opacity-0"
          )}
        >
          <Trash2 className="w-5 h-5 text-destructive-foreground" />
        </div>
      </div>
      
      {/* Content */}
      <div
        {...handlers}
        className={cn(
          "relative bg-popover transition-transform touch-pan-y",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableItem;
