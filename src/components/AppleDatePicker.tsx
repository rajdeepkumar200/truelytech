import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

interface AppleDatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export function AppleDatePicker({ 
  open, 
  onOpenChange, 
  value, 
  onChange,
  minDate = new Date()
}: AppleDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  useEffect(() => {
    if (value) setSelectedDate(value);
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onChange(date);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Select Date
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className={cn(
              "rounded-lg border-0",
              "[&_.rdp-months]:flex [&_.rdp-months]:flex-col [&_.rdp-months]:gap-4",
              "[&_.rdp-month]:space-y-4",
              "[&_.rdp-caption]:flex [&_.rdp-caption]:justify-center [&_.rdp-caption]:items-center [&_.rdp-caption]:relative",
              "[&_.rdp-caption_button]:h-8 [&_.rdp-caption_button]:w-8 [&_.rdp-caption_button]:rounded-full [&_.rdp-caption_button]:bg-transparent [&_.rdp-caption_button]:hover:bg-accent [&_.rdp-caption_button]:transition-colors",
              "[&_.rdp-caption_button:disabled]:opacity-30",
              "[&_.rdp-nav]:flex [&_.rdp-nav]:items-center [&_.rdp-nav]:gap-1 [&_.rdp-nav]:absolute [&_.rdp-nav]:right-0",
              "[&_.rdp-month_caption]:text-sm [&_.rdp-month_caption]:font-semibold [&_.rdp-month_caption]:text-foreground",
              "[&_.rdp-weekdays]:flex [&_.rdp-weekdays]:justify-between",
              "[&_.rdp-weekday]:text-xs [&_.rdp-weekday]:font-medium [&_.rdp-weekday]:text-muted-foreground [&_.rdp-weekday]:w-10 [&_.rdp-weekday]:text-center",
              "[&_.rdp-week]:flex [&_.rdp-week]:justify-between [&_.rdp-week]:mt-2",
              "[&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-day]:rounded-full [&_.rdp-day]:text-sm [&_.rdp-day]:font-normal [&_.rdp-day]:transition-all [&_.rdp-day]:duration-200",
              "[&_.rdp-day:hover]:bg-accent [&_.rdp-day:hover]:scale-105",
              "[&_.rdp-day_button]:w-full [&_.rdp-day_button]:h-full [&_.rdp-day_button]:rounded-full",
              "[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_selected]:font-semibold [&_.rdp-day_selected]:shadow-sm [&_.rdp-day_selected]:scale-110",
              "[&_.rdp-day_today]:bg-accent/40 [&_.rdp-day_today]:font-semibold",
              "[&_.rdp-day_disabled]:opacity-30 [&_.rdp-day_disabled]:cursor-not-allowed",
              "[&_.rdp-day_outside]:text-muted-foreground/50",
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
