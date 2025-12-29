import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useSound';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AppleTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const AppleTimePicker = ({ value, onChange, open, onOpenChange }: AppleTimePickerProps) => {
  const [hour, minute] = value ? value.split(':') : ['09', '00'];
  const [selectedHour, setSelectedHour] = useState(hour || '09');
  const [selectedMinute, setSelectedMinute] = useState(minute || '00');
  
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const [h, m] = value ? value.split(':') : ['09', '00'];
      setSelectedHour(h || '09');
      setSelectedMinute(m || '00');
      
      // Scroll to selected values
      setTimeout(() => {
        scrollToValue(hourRef.current, parseInt(h || '09'));
        scrollToValue(minuteRef.current, parseInt(m || '00'));
      }, 100);
    }
  }, [open, value]);

  const scrollToValue = (container: HTMLDivElement | null, index: number) => {
    if (container) {
      container.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
  };

  const lastValueRef = useRef({ hour: '', minute: '' });

  const handleScroll = (ref: React.RefObject<HTMLDivElement>, type: 'hour' | 'minute', values: string[]) => {
    if (!ref.current) return;
    
    const scrollTop = ref.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
    const newValue = values[clampedIndex];
    
    if (lastValueRef.current[type] !== newValue) {
      triggerHaptic(10);
      lastValueRef.current[type] = newValue;
    }
    
    if (type === 'hour') {
      setSelectedHour(newValue);
    } else {
      setSelectedMinute(newValue);
    }
  };

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    onOpenChange(false);
    triggerHaptic(30);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] p-0 overflow-hidden rounded-3xl bg-popover border-border/50">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-center text-lg font-semibold">Select Time</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex justify-center gap-2 px-6 py-4">
          {/* Hour Picker */}
          <div className="relative w-20 h-[220px]">
            <div 
              ref={hourRef}
              className="absolute inset-0 overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
              onScroll={() => handleScroll(hourRef, 'hour', hours)}
              style={{ scrollSnapType: 'y mandatory' }}
            >
              <div style={{ height: ITEM_HEIGHT * 2 }} />
              {hours.map((h) => (
                <div
                  key={h}
                  className={cn(
                    "h-[44px] flex items-center justify-center text-2xl font-medium transition-all snap-center",
                    selectedHour === h 
                      ? "text-foreground scale-110" 
                      : "text-muted-foreground/50 scale-90"
                  )}
                  onClick={() => {
                    setSelectedHour(h);
                    scrollToValue(hourRef.current, parseInt(h));
                    triggerHaptic(10);
                  }}
                >
                  {h}
                </div>
              ))}
              <div style={{ height: ITEM_HEIGHT * 2 }} />
            </div>
            
            {/* Selection highlight */}
            <div className="absolute top-1/2 left-0 right-0 h-[44px] -translate-y-1/2 border-y-2 border-primary/30 pointer-events-none rounded-xl bg-primary/5" />
          </div>

          {/* Separator */}
          <div className="flex items-center text-3xl font-bold text-foreground">:</div>

          {/* Minute Picker */}
          <div className="relative w-20 h-[220px]">
            <div 
              ref={minuteRef}
              className="absolute inset-0 overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
              onScroll={() => handleScroll(minuteRef, 'minute', minutes)}
              style={{ scrollSnapType: 'y mandatory' }}
            >
              <div style={{ height: ITEM_HEIGHT * 2 }} />
              {minutes.map((m) => (
                <div
                  key={m}
                  className={cn(
                    "h-[44px] flex items-center justify-center text-2xl font-medium transition-all snap-center",
                    selectedMinute === m 
                      ? "text-foreground scale-110" 
                      : "text-muted-foreground/50 scale-90"
                  )}
                  onClick={() => {
                    setSelectedMinute(m);
                    scrollToValue(minuteRef.current, parseInt(m));
                    triggerHaptic(10);
                  }}
                >
                  {m}
                </div>
              ))}
              <div style={{ height: ITEM_HEIGHT * 2 }} />
            </div>
            
            {/* Selection highlight */}
            <div className="absolute top-1/2 left-0 right-0 h-[44px] -translate-y-1/2 border-y-2 border-primary/30 pointer-events-none rounded-xl bg-primary/5" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppleTimePicker;
