import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ClockWidget from '@/components/ClockWidget';
import HabitTable from '@/components/HabitTable';
import AddHabitRow from '@/components/AddHabitRow';
import DailySchedule from '@/components/DailySchedule';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
}

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
}

const defaultHabits: Habit[] = [
  { id: '1', name: 'clean desk', icon: '🧹', completedDays: [true, true, true, true, true, true, true] },
  { id: '2', name: 'check into notion', icon: '💻', completedDays: [true, true, true, true, true, false, false] },
  { id: '3', name: 'journal', icon: '📝', completedDays: [true, true, true, true, false, false, false] },
  { id: '4', name: 'exercise', icon: '💪', completedDays: [true, true, false, true, false, false, false] },
  { id: '5', name: 'drink water', icon: '💧', completedDays: [true, true, true, true, false, false, false] },
  { id: '6', name: 'meditate', icon: '🧘', completedDays: [true, true, true, true, true, true, false] },
  { id: '7', name: 'listen to uplifting music', icon: '🎵', completedDays: [true, true, false, false, false, true, false] },
  { id: '8', name: 'brush hair', icon: '💇', completedDays: [true, true, true, true, false, true, false] },
  { id: '9', name: 'shower', icon: '🚿', completedDays: [true, true, true, true, true, true, false] },
  { id: '10', name: 'skin care', icon: '😊', completedDays: [true, true, true, true, true, false, false] },
  { id: '11', name: 'brush teeth', icon: '🦷', completedDays: [true, true, true, true, true, true, false] },
  { id: '12', name: 'style hair', icon: '💇', completedDays: [true, false, false, false, false, false, false] },
];

const defaultSchedule: ScheduleItem[] = [
  { id: '1', time: '05:00', task: 'morning ritual' },
  { id: '2', time: '06:00', task: '' },
  { id: '3', time: '07:00', task: '' },
  { id: '4', time: '09:00', task: 'cleaning ritual' },
  { id: '5', time: '10:00', task: '' },
  { id: '6', time: '11:00', task: 'prepare lunch' },
];

const Index = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits-v2');
    return saved ? JSON.parse(saved) : defaultHabits;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  const today = new Date();

  useEffect(() => {
    localStorage.setItem('habits-v2', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [schedule]);

  const handleToggleDay = (habitId: string, dayIndex: number) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const newCompletedDays = [...habit.completedDays];
        newCompletedDays[dayIndex] = !newCompletedDays[dayIndex];
        return { ...habit, completedDays: newCompletedDays };
      }
      return habit;
    }));
  };

  const handleAddHabit = (name: string, icon: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      icon,
      completedDays: Array(7).fill(false),
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
  };

  const handleAddScheduleItem = (time: string, task: string) => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      time,
      task,
    };
    setSchedule(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleDeleteScheduleItem = (id: string) => {
    setSchedule(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Title */}
      <header className="pt-8 pb-4 px-6">
        <h1 className="font-display text-4xl md:text-5xl text-foreground text-center tracking-tight">
          Daily Habits
        </h1>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Left Column - Clock & Schedule */}
            <div className="space-y-6">
              {/* Clock Widget */}
              <div className="flex justify-center lg:justify-start">
                <ClockWidget />
              </div>

              {/* Daily Schedule */}
              <DailySchedule
                items={schedule.filter(item => item.task)}
                onAddItem={handleAddScheduleItem}
                onDeleteItem={handleDeleteScheduleItem}
              />
            </div>

            {/* Right Column - Habit Tracker */}
            <div className="space-y-4 animate-fade-in">
              {/* Morning Ritual Section */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">▼</span>
                <span className="font-medium text-foreground">Morning Ritual</span>
                <span className="text-xs">✦ ☁ ✦ ✿ ☀ ✿ ✦ ✦ ✿ ✿ ✦ ✦ ✦ ✿ ☀ ✿ ✦ ✦ ✿ ✿ ✦ ☁ ✦ ✿ ☁ ✦ ✿ ✿ ✦ ✦ ✿</span>
              </div>

              {/* Habit Table */}
              <div className="overflow-x-auto">
                <HabitTable
                  habits={habits}
                  onToggleDay={handleToggleDay}
                  onDeleteHabit={handleDeleteHabit}
                />
                <AddHabitRow onAdd={handleAddHabit} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
