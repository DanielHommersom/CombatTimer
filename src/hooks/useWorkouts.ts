import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Workout } from '../types/workout';

const STORAGE_KEY = 'workouts';

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UseWorkoutsResult {
  workouts: Workout[];
  loading: boolean;
  addWorkout: (data: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkout: (updated: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
}

export function useWorkouts(): UseWorkoutsResult {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed: Workout[] = JSON.parse(raw);
          // Back-fill fields missing from workouts saved before this version
          setWorkouts(
            parsed.map((w) => ({
              warmUp:   '0:00',
              coolDown: '0:00',
              ...w,
            })),
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (next: Workout[]) => {
    setWorkouts(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addWorkout = useCallback(
    async (data: Omit<Workout, 'id' | 'createdAt'>) => {
      const workout: Workout = { ...data, id: uuid(), createdAt: Date.now() };
      await persist([...workouts, workout]);
    },
    [workouts, persist],
  );

  const updateWorkout = useCallback(
    async (updated: Workout) => {
      await persist(workouts.map((w) => (w.id === updated.id ? updated : w)));
    },
    [workouts, persist],
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      await persist(workouts.filter((w) => w.id !== id));
    },
    [workouts, persist],
  );

  return { workouts, loading, addWorkout, updateWorkout, deleteWorkout };
}
