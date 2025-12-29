import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ClockWidget from '@/components/ClockWidget';
import HabitTable from '@/components/HabitTable';
import AddHabitRow from '@/components/AddHabitRow';
import DailySchedule from '@/components/DailySchedule';
import MotivationModal from '@/components/MotivationModal';
import NotificationPrompt from '@/components/NotificationPrompt';
import PomodoroTimer from '@/components/PomodoroTimer';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDays: boolean[];
  activeDays: boolean[];
}

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
}

const defaultHabits: Habit[] = [
  { id: '1', name: 'clean desk', icon: '🧹', completedDays: [true, true, true, true, true, true, true], activeDays: Array(7).fill(true) },
  { id: '2', name: 'check into notion', icon: '💻', completedDays: [true, true, true, true, true, false, false], activeDays: Array(7).fill(true) },
  { id: '3', name: 'journal', icon: '📝', completedDays: [true, true, true, true, false, false, false], activeDays: Array(7).fill(true) },
  { id: '4', name: 'exercise', icon: '💪', completedDays: [true, true, false, true, false, false, false], activeDays: [true, true, true, true, true, false, false] },
  { id: '5', name: 'drink water', icon: '💧', completedDays: [true, true, true, true, false, false, false], activeDays: Array(7).fill(true) },
  { id: '6', name: 'meditate', icon: '🧘', completedDays: [true, true, true, true, true, true, false], activeDays: Array(7).fill(true) },
  { id: '7', name: 'listen to uplifting music', icon: '🎵', completedDays: [true, true, false, false, false, true, false], activeDays: Array(7).fill(true) },
  { id: '8', name: 'brush hair', icon: '💇', completedDays: [true, true, true, true, false, true, false], activeDays: Array(7).fill(true) },
  { id: '9', name: 'shower', icon: '🚿', completedDays: [true, true, true, true, true, true, false], activeDays: Array(7).fill(true) },
  { id: '10', name: 'skin care', icon: '😊', completedDays: [true, true, true, true, true, false, false], activeDays: Array(7).fill(true) },
  { id: '11', name: 'brush teeth', icon: '🦷', completedDays: [true, true, true, true, true, true, false], activeDays: Array(7).fill(true) },
  { id: '12', name: 'style hair', icon: '💇', completedDays: [true, false, false, false, false, false, false], activeDays: [true, false, false, true, false, false, false] },
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
    const saved = localStorage.getItem('habits-v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old habits that don't have activeDays
      return parsed.map((h: any) => ({
        ...h,
        activeDays: h.activeDays || Array(7).fill(true)
      }));
    }
    return defaultHabits;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('schedule');
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  const today = new Date();

  useEffect(() => {
    localStorage.setItem('habits-v3', JSON.stringify(habits));
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
      activeDays: Array(7).fill(true),
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
  };

  const handleUpdateActiveDays = (habitId: string, activeDays: boolean[]) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, activeDays };
      }
      return habit;
    }));
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

  const handleEditScheduleItem = (id: string, time: string, task: string) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, time, task };
      }
      return item;
    }).sort((a, b) => a.time.localeCompare(b.time)));
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <MotivationModal />
      <NotificationPrompt />
      
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
            {/* Left Column - Clock & Schedule & Pomodoro */}
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
                onEditItem={handleEditScheduleItem}
              />

              {/* Pomodoro Timer */}
              <PomodoroTimer />
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
                  onUpdateActiveDays={handleUpdateActiveDays}
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
