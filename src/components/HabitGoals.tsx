import { Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
  weeklyGoal?: number;
}

interface HabitGoalsProps {
  habits: Habit[];
  onUpdateGoal: (habitId: string, goal: number) => void;
}

const HabitGoals = ({ habits, onUpdateGoal }: HabitGoalsProps) => {
  // Get habits with goals
  const habitsWithGoals = habits.filter(h => h.weeklyGoal && h.weeklyGoal > 0);
  
  if (habitsWithGoals.length === 0) {
    return null;
  }

  return (
    <div className="bg-popover rounded-2xl border border-border/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">Weekly Goals</h3>
      </div>

      <div className="space-y-3">
        {habitsWithGoals.map(habit => {
          const activeDays = habit.activeDays || Array(7).fill(true);
          const completedCount = habit.completedDays.filter((c, i) => c && activeDays[i]).length;
          const goal = habit.weeklyGoal || 0;
          const progressPercent = goal > 0 ? Math.min((completedCount / goal) * 100, 100) : 0;
          const isAchieved = completedCount >= goal;

          return (
            <div key={habit.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{habit.icon}</span>
                  <span className="text-sm text-foreground">{habit.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-medium",
                    isAchieved ? "text-accent" : "text-muted-foreground"
                  )}>
                    {completedCount}/{goal}
                  </span>
                  {isAchieved && (
                    <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
              </div>
              <Progress 
                value={progressPercent} 
                className={cn(
                  "h-2",
                  isAchieved && "[&>div]:bg-accent"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitGoals;