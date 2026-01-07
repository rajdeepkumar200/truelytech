import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface DateTimePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: Date;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onConfirm: () => void;
}

export function DateTimePicker({
  open,
  onOpenChange,
  date,
  time,
  onDateChange,
  onTimeChange,
  onConfirm,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [selectedTime, setSelectedTime] = useState(time);

  useEffect(() => {
    if (open) {
      setSelectedDate(date);
      setSelectedTime(time);
    }
  }, [open, date, time]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onDateChange(selectedDate);
    onTimeChange(selectedTime);
    onConfirm();
    onOpenChange(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const [hour, minute] = selectedTime.split(':');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Select Date & Time
          </DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              Date
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn(
                "rounded-lg border border-border/50 bg-muted/20 p-3",
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
                "[&_.rdp-day_outside]:text-muted-foreground/50"
              )}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(undefined)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Clear date (use day of week)
              </button>
            )}
          </div>

          {/* Time Picker Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="w-4 h-4" />
              Time
            </div>
            <div className="border border-border/50 rounded-lg bg-muted/20 p-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="text-5xl font-semibold tabular-nums text-foreground">
                  {hour}:{minute}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Hour Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Hour</label>
                  <div className="h-48 overflow-y-auto rounded-lg border border-border bg-background">
                    {hours.map((h) => (
                      <button
                        key={h}
                        onClick={() => setSelectedTime(`${h}:${minute}`)}
                        className={cn(
                          "w-full px-3 py-2 text-center text-sm transition-colors",
                          h === hour
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minute Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Minute</label>
                  <div className="h-48 overflow-y-auto rounded-lg border border-border bg-background">
                    {minutes.filter((_, i) => i % 5 === 0).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedTime(`${hour}:${m}`)}
                        className={cn(
                          "w-full px-3 py-2 text-center text-sm transition-colors",
                          m === minute
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-muted/30">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
