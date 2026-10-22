import { ExerciseDefinition } from '../types/exercise';
import { BicepCurlExercise } from './bicep-curl';
import { SquatExercise } from './squat';
import { OverheadPressExercise } from './overhead-press';
import { PushUpExercise } from './pushup';

class ExerciseRegistry {
  private exercises: Map<string, ExerciseDefinition> = new Map();

  constructor() {
    this.register(new BicepCurlExercise());
    this.register(new SquatExercise());
    this.register(new OverheadPressExercise());
    this.register(new PushUpExercise());
  }

  public register(exercise: ExerciseDefinition): void {
    this.exercises.set(exercise.id, exercise);
  }

  public get(id: string): ExerciseDefinition | undefined {
    return this.exercises.get(id);
  }

  public getAll(): ExerciseDefinition[] {
    return Array.from(this.exercises.values());
  }

  public getDefault(): ExerciseDefinition {
    const first = this.exercises.values().next().value;
    if (!first) {
      throw new Error('ExerciseRegistry: No exercises registered.');
    }
    return first;
  }
}

export const exerciseRegistry = new ExerciseRegistry();
