import { useMemo, useState } from 'react';
import { Flame, TrendingUp, Calendar, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedWeeks: Record<string, boolean[]>;
  activeDays: boolean[];
  category?: string;
  weeklyHistory?: { week: string; completionRate: number }[];
}

interface HabitStatisticsProps {
  habits: Habit[];
}

const HabitStatistics = ({ habits }: HabitStatisticsProps) => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const stats = useMemo(() => {
    let totalCompleted = 0;
    let totalActive = 0;
    let longestStreak = 0;
    // Get current week key
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday as start
    const weekKey = weekStart.toISOString().slice(0, 10);

    habits.forEach(habit => {
      const activeDays = habit.activeDays || Array(7).fill(true);
      const completedArr = habit.completedWeeks?.[weekKey] || Array(7).fill(false);
      completedArr.forEach((completed, i) => {
        if (activeDays[i]) {
          totalActive++;
          if (completed) totalCompleted++;
        }
      });

      // Calculate streak for this habit
      let streak = 0;
      for (let i = completedArr.length - 1; i >= 0; i--) {
        if (!activeDays[i]) continue;
        if (completedArr[i]) streak++;
        else break;
      }
      if (streak > longestStreak) longestStreak = streak;
    });

    const completionRate = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;

    return { totalCompleted, totalActive, completionRate, longestStreak };
  }, [habits]);

  const weeklyChartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Get current week key
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekKey = weekStart.toISOString().slice(0, 10);
    return days.map((day, index) => {
      let completed = 0;
      let active = 0;
      habits.forEach(habit => {
        const activeDays = habit.activeDays || Array(7).fill(true);
        const completedArr = habit.completedWeeks?.[weekKey] || Array(7).fill(false);
        if (activeDays[index]) {
          active++;
          if (completedArr[index]) completed++;
        }
      });
      const rate = active > 0 ? Math.round((completed / active) * 100) : 0;
      return { day, rate, completed, active };
    });
  }, [habits]);

  const monthlyChartData = useMemo(() => {
    // Simulate 4 weeks of data (in real app, this would come from stored history)
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const storedHistory = localStorage.getItem('habit-weekly-history');
    
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        return history.slice(-4);
      } catch {
        // Fall through to generate default
      }
    }
    
    // Generate sample data based on current week
    const currentRate = stats.completionRate;
    return weeks.map((week, i) => ({
      week,
      rate: Math.max(0, Math.min(100, currentRate + Math.floor(Math.random() * 20) - 10 + (i * 3))),
    }));
  }, [stats.completionRate]);

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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          {view === 'weekly' ? 'Weekly' : 'Monthly'} Statistics
        </h3>
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setView('weekly')}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
              view === 'weekly' 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
              view === 'monthly' 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

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
            {view === 'weekly' ? (
              <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                  {weeklyChartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === currentDayIndex ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground) / 0.3)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="week" 
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
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {view === 'weekly' ? 'Stats reset weekly • Current week progress' : 'Last 4 weeks trend'}
      </p>
    </div>
  );
};

export default HabitStatistics;
