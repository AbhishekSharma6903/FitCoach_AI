export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group:         string | null;
  equipment:            string | null;
  level:                string | null;
  met_value:            number;
  // Phase 6 — wger image + muscle data
  image_url_thumb:      string | null;
  primary_muscle_ids:   string | null;  // "4;2" semicolon-separated
  secondary_muscle_ids: string | null;
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
  // Phase 6 — denormalized from exercise_library
  image_url_thumb:      string | null;
  primary_muscle_ids:   string | null;
  secondary_muscle_ids: string | null;
}

export interface DailyWorkout {
  log_date: string;
  entries: WorkoutLogEntry[];
  total_calories_burned: number;
}
