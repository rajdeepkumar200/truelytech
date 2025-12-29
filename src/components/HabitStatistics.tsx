import { useMemo } from 'react';
import { Flame, TrendingUp, Calendar, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
  category?: string;
}

interface HabitStatisticsProps {
  habits: Habit[];
}

const HabitStatistics = ({ habits }: HabitStatisticsProps) => {
  const stats = useMemo(() => {
    let totalCompleted = 0;
    let totalActive = 0;
    let longestStreak = 0;

    habits.forEach(habit => {
      const activeDays = habit.activeDays || Array(7).fill(true);
      habit.completedDays.forEach((completed, i) => {
        if (activeDays[i]) {
          totalActive++;
          if (completed) totalCompleted++;
        }
      });

      // Calculate streak for this habit
      let streak = 0;
      for (let i = habit.completedDays.length - 1; i >= 0; i--) {
        if (!activeDays[i]) continue;
        if (habit.completedDays[i]) streak++;
        else break;
      }
      if (streak > longestStreak) longestStreak = streak;
    });

    const completionRate = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;

    return { totalCompleted, totalActive, completionRate, longestStreak };
  }, [habits]);

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => {
      let completed = 0;
      let active = 0;
      habits.forEach(habit => {
        const activeDays = habit.activeDays || Array(7).fill(true);
        if (activeDays[index]) {
          active++;
          if (habit.completedDays[index]) completed++;
        }
      });
      const rate = active > 0 ? Math.round((completed / active) * 100) : 0;
      return { day, rate, completed, active };
    });
  }, [habits]);

  const chartConfig = {
    rate: {
      label: "Completion %",
      color: "hsl(var(--accent))",
    },
  };

  // Get current day index (0 = Monday)
  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return (
    <div className="bg-popover rounded-2xl border border-border/50 p-4 space-y-4">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent" />
        Weekly Statistics
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-accent mb-1">
            <Target className="w-4 h-4" />
          </div>
          <p className="text-xl font-semibold text-foreground">{stats.completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-xl font-semibold text-foreground">{stats.longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xl font-semibold text-foreground">{stats.totalCompleted}/{stats.totalActive}</p>
          <p className="text-xs text-muted-foreground">This Week</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === currentDayIndex ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground) / 0.3)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Stats reset weekly • Current week progress
      </p>
    </div>
  );
};

export default HabitStatistics;
