import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
}

interface ConsistencyGraphProps {
  habits: Habit[];
}

const ConsistencyGraph = ({ habits }: ConsistencyGraphProps) => {
  // Generate data for the last 7 days
  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayOfWeek = date.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      let totalActive = 0;
      let totalCompleted = 0;
      
      habits.forEach(habit => {
        if (habit.activeDays[dayIndex]) {
          totalActive++;
          if (habit.completedDays[dayIndex]) {
            totalCompleted++;
          }
        }
      });
      
      const progress = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
      
      data.push({
        day: format(date, 'EEE'),
        date: format(date, 'MMM d'),
        progress,
        completed: totalCompleted,
        total: totalActive
      });
    }
    
    return data;
  }, [habits]);

  // Calculate overall weekly stats
  const weeklyStats = useMemo(() => {
    const totalCompleted = chartData.reduce((acc, d) => acc + d.completed, 0);
    const totalActive = chartData.reduce((acc, d) => acc + d.total, 0);
    const avgProgress = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
    
    return { totalCompleted, totalActive, avgProgress };
  }, [chartData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Weekly Consistency</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            Avg: <strong className="text-accent">{weeklyStats.avgProgress}%</strong>
          </span>
          <span className="text-muted-foreground">
            Done: <strong className="text-foreground">{weeklyStats.totalCompleted}/{weeklyStats.totalActive}</strong>
          </span>
        </div>
      </div>

      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-xs font-medium text-foreground">{data.date}</p>
                      <p className="text-xs text-muted-foreground">
                        Progress: <span className="text-accent font-medium">{data.progress}%</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Completed: {data.completed}/{data.total}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#progressGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsistencyGraph;
