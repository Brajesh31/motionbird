import { RepRecord, RepQuality } from './exercise';

export interface SetRecord {
  setNumber: number;
  exerciseId: string;
  targetReps: number;
  completedReps: number;
  reps: RepRecord[];
  startedAt: number;
  completedAt?: number;
  durationMs: number;
  restDurationSeconds: number;
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsPerSet: number;
  completedSets: SetRecord[];
  totalReps: number;
  averageRomDegrees: number;
  bestSetReps: number;
  qualityBreakdown: {
    clean: number;
    good: number;
    partial: number;
  };
  commonFaults: string[];
}

export type WorkoutSessionStatus =
  | 'setup'
  | 'calibrating'
  | 'active'
  | 'resting'
  | 'paused'
  | 'completed'
  | 'abandoned';

export interface WorkoutSession {
  id: string;
  name: string;
  startedAt: number;
  completedAt?: number;
  durationSeconds: number;
  status: WorkoutSessionStatus;
  currentExerciseIndex: number;
  currentSetIndex: number;
  restTimeRemainingSeconds: number;
  activeRestDurationSeconds: number;
  exercises: ExerciseSession[];
  totalReps: number;
  averageFormScore: number; // 0-100
  bestExerciseName?: string;
  comparison?: SessionComparison;
}

export interface SessionComparison {
  hasPrevious: boolean;
  repDiffPercent: number;
  durationDiffPercent: number;
  formScoreDiffPercent: number;
  summaryInsight: string;
}

export interface WorkoutPlanItem {
  exerciseId: string;
  sets: number;
  targetReps: number;
  restSeconds: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDurationMinutes: number;
  items: WorkoutPlanItem[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'milestone' | 'consistency' | 'mastery';
  unlockedAt?: number;
  isUnlocked: boolean;
}

export interface UserProfile {
  name: string;
  goal: 'General Fitness' | 'Strength & Muscle' | 'Consistency' | 'Form Mastery' | 'Mobility';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredDurationMinutes: number;
  completedWorkoutsCount: number;
  totalRepsLogged: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastWorkoutDate?: string;
  personalRecords: {
    maxRepsInSet: { exerciseId: string; exerciseName: string; reps: number; date: string };
    longestSessionMinutes: number;
    highestFormScore: number;
  };
  achievements: Achievement[];
}

export interface UserGoal {
  id: string;
  title: string;
  metricType: 'workouts' | 'reps' | 'streak';
  targetValue: number;
  currentValue: number;
  completed: boolean;
  createdAt: number;
}

export interface DebugMetrics {
  fps: number;
  inferenceMs: number;
  trackingConfidence: number;
  canvasResolution: string;
  activeJointAngles: Record<string, number>;
  trackingStatus: string;
}
