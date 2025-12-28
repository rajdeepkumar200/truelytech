import { useState, useEffect } from 'react';
import { format, getDay } from 'date-fns';
import ClockWidget from '@/components/ClockWidget';
import HabitRow from '@/components/HabitRow';
import AddHabitForm from '@/components/AddHabitForm';

interface Habit {
  id: string;
  name: string;
  completedDays: boolean[];
}

const defaultHabits: Habit[] = [
  { id: '1', name: 'Morning Meditation', completedDays: [true, true, false, false, false, false, false] },
  { id: '2', name: 'Read 30 Minutes', completedDays: [true, false, true, false, false, false, false] },
  { id: '3', name: 'Exercise', completedDays: [false, true, false, false, false, false, false] },
];

const Index = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : defaultHabits;
  });

  // Get today's index (0 = Monday, 6 = Sunday)
  const today = new Date();
  const dayOfWeek = getDay(today);
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

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

  const handleAddHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completedDays: Array(7).fill(false),
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== habitId));
  };

  const totalCompleted = habits.reduce(
    (acc, habit) => acc + habit.completedDays.filter(Boolean).length,
    0
  );
  const totalPossible = habits.length * 7;
  const overallProgress = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Clock Widget - Hero Section */}
      <header className="pt-8 pb-8 px-6">
        <div className="max-w-3xl mx-auto flex justify-center">
          <ClockWidget />
        </div>
      </header>

      {/* Title Section */}
      <div className="px-6 pb-4">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">
            {format(today, 'MMMM yyyy')}
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground tracking-tight">
            Daily Habits
          </h1>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 mb-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-popover rounded-xl p-4 shadow-sm flex items-center justify-between animate-slide-up">
            <div>
              <p className="text-muted-foreground text-sm">Weekly Progress</p>
              <p className="font-display text-2xl text-foreground">{overallProgress}%</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="font-display text-2xl text-foreground">
                {totalCompleted}/{totalPossible}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <main className="px-6 pb-12">
        <div className="max-w-2xl mx-auto space-y-4">
          {habits.map((habit, index) => (
            <div 
              key={habit.id}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <HabitRow
                name={habit.name}
                completedDays={habit.completedDays}
                todayIndex={todayIndex}
                onToggleDay={(dayIndex) => handleToggleDay(habit.id, dayIndex)}
                onDelete={() => handleDeleteHabit(habit.id)}
              />
            </div>
          ))}
          
          <AddHabitForm onAdd={handleAddHabit} />
        </div>
      </main>
    </div>
  );
};

export default Index;
