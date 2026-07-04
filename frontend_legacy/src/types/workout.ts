export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string | null;
  equipment: string | null;
  level: string | null;
  met_value: number;
}

export interface WorkoutLogEntry {
  id: number;
  user_id: string;
  log_date: string;
  exercise_id: number | null;
  exercise_name: string;
  category: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_min: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string;
}

export interface DailyWorkout {
  log_date: string;
  entries: WorkoutLogEntry[];
  total_calories_burned: number;
}
