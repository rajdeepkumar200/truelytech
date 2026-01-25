import { CheckCircle2, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressItem {
  completed?: boolean;
}

interface DailyProgressSummaryProps {
  scheduleItems: ProgressItem[];
  reminders: ProgressItem[];
  habits: { completedWeeks: Record<string, boolean[]> }[];
}

const DailyProgressSummary = ({ scheduleItems, reminders, habits }: DailyProgressSummaryProps) => {
  const completedTasks = scheduleItems.filter(i => i.completed).length;
  const totalTasks = scheduleItems.length;
  
  const completedReminders = reminders.filter(r => r.completed).length;
  const totalReminders = reminders.length;
  
  // Get today's habit progress (0 = Monday, 6 = Sunday)
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekKey = weekStart.toISOString().slice(0, 10);
  const completedHabits = habits.filter(h => (h.completedWeeks?.[weekKey] ?? [])[todayIndex]).length;
  const totalHabits = habits.length;
  
  const totalCompleted = completedTasks + completedReminders + completedHabits;
  const totalItems = totalTasks + totalReminders + totalHabits;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-2xl p-4 border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Today's Progress
        </h3>
        <span className={cn(
          "text-lg font-bold",
          overallProgress >= 80 ? "text-accent" :
          overallProgress >= 50 ? "text-primary" : "text-muted-foreground"
        )}>
          {overallProgress}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            overallProgress >= 80 ? "bg-accent" :
            overallProgress >= 50 ? "bg-primary" : "bg-muted-foreground"
          )}
          style={{ width: `${overallProgress}%` }}
        />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-xl bg-popover/50">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <Clock className="w-3 h-3" />
            Tasks
          </div>
          <div className="text-sm font-semibold text-foreground">
            {completedTasks}/{totalTasks}
          </div>
        </div>
        
        <div className="text-center p-2 rounded-xl bg-popover/50">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <CheckCircle2 className="w-3 h-3" />
            Habits
          </div>
          <div className="text-sm font-semibold text-foreground">
            {completedHabits}/{totalHabits}
          </div>
        </div>
        
        <div className="text-center p-2 rounded-xl bg-popover/50">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
            <Target className="w-3 h-3" />
            Reminders
          </div>
          <div className="text-sm font-semibold text-foreground">
            {completedReminders}/{totalReminders}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressSummary;
