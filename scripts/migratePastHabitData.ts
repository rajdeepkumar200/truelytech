// Script to migrate/import past habit completion data into Firestore
// Usage: Run this script to fill in missing completedWeeks for past dates

import { getFirebaseDb } from '../src/integrations/firebase/client';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

// Helper to get ISO week key for a given date
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

async function migratePastHabitData(userId: string, startDate: Date, endDate: Date) {
  const db = getFirebaseDb();
  const habitsCol = collection(db, 'users', userId, 'habits');
  const snap = await getDocs(habitsCol);
  const batch = writeBatch(db);

  snap.forEach((docSnap) => {
    const habit = docSnap.data();
    const completedWeeks = { ...habit.completedWeeks };
    let date = new Date(startDate);
    while (date <= endDate) {
      const weekKey = getWeekKey(date);
      if (!completedWeeks[weekKey]) {
        completedWeeks[weekKey] = Array(7).fill(false); // initialize as all false
      }
      date.setDate(date.getDate() + 7); // next week
    }
    batch.set(doc(habitsCol, docSnap.id), {
      ...habit,
      completedWeeks,
    });
  });

  await batch.commit();
  console.log('Migration complete!');
}

// Example usage:
// migratePastHabitData('YOUR_USER_ID', new Date('2026-01-01'), new Date('2026-01-21'));

export { migratePastHabitData };
