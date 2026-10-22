import { WorkoutPlan } from '../types/session';

export const PRESET_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'full-body-foundation',
    name: 'Full Body Foundation',
    description: 'Balanced foundational workout hitting lower body, chest, and arms with strict form analysis.',
    level: 'Beginner',
    estimatedDurationMinutes: 18,
    items: [
      { exerciseId: 'squat', sets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseId: 'pushup', sets: 3, targetReps: 8, restSeconds: 60 },
      { exerciseId: 'bicep-curl', sets: 3, targetReps: 12, restSeconds: 45 },
    ],
  },
  {
    id: 'upper-body-power',
    name: 'Upper Body Power',
    description: 'Targeted pressing and arm flexion to build upper body strength and shoulder stability.',
    level: 'Intermediate',
    estimatedDurationMinutes: 15,
    items: [
      { exerciseId: 'overhead-press', sets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseId: 'pushup', sets: 3, targetReps: 10, restSeconds: 60 },
      { exerciseId: 'bicep-curl', sets: 3, targetReps: 12, restSeconds: 45 },
    ],
  },
  {
    id: 'squat-and-press',
    name: 'Compound Push & Squat',
    description: 'High-efficiency dual compound movement session emphasizing full range of motion.',
    level: 'Intermediate',
    estimatedDurationMinutes: 12,
    items: [
      { exerciseId: 'squat', sets: 4, targetReps: 12, restSeconds: 60 },
      { exerciseId: 'overhead-press', sets: 4, targetReps: 10, restSeconds: 60 },
    ],
  },
  {
    id: 'single-exercise',
    name: 'Quick Practice Session',
    description: 'Single-exercise focus session to dial in movement mechanics and technique.',
    level: 'Beginner',
    estimatedDurationMinutes: 8,
    items: [
      { exerciseId: 'bicep-curl', sets: 3, targetReps: 10, restSeconds: 45 },
    ],
  },
];
