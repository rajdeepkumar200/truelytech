import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { isAfter, startOfDay } from 'date-fns';

interface ConsistencyGraphProps {
  data: number[];
  days: Date[];
}

const ConsistencyGraph = ({ data, days }: ConsistencyGraphProps) => {
  const today = startOfDay(new Date());

  const chartData = data.map((progress, index) => {
    const date = days[index];
    const isFuture = isAfter(startOfDay(date), today);
    return {
      progress: isFuture ? null : progress,
      date: date,
    };
  });

  // Calculate width based on 32px per column
  const width = days.length * 32;

  return (
    <div style={{ width: `${width}px`, height: '60px' }} className="mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                if (data.progress === null) return null;
                return (
                  <div className="bg-popover border border-border rounded-lg px-2 py-1 shadow-lg text-xs">
                    <p className="font-medium text-foreground">{data.progress}%</p>
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
            animationDuration={500}
            dot={{ r: 2, fill: 'hsl(var(--accent))', strokeWidth: 0 }}
            activeDot={{ r: 4, fill: 'hsl(var(--accent))', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConsistencyGraph;
