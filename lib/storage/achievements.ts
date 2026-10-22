import { Achievement, SessionComparison, WorkoutSession } from '../types/session';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-workout',
    title: 'First Step',
    description: 'Complete your first motion-tracked training session.',
    category: 'milestone',
    isUnlocked: false,
  },
  {
    id: 'reps-100',
    title: 'Century Club',
    description: 'Accumulate 100 total repetitions across any exercise.',
    category: 'milestone',
    isUnlocked: false,
  },
  {
    id: 'squat-master',
    title: 'Deep Squat Champion',
    description: 'Complete a squat session with at least 80% form accuracy.',
    category: 'mastery',
    isUnlocked: false,
  },
  {
    id: 'press-pro',
    title: 'Overhead Lockout',
    description: 'Complete an overhead press session with full extension.',
    category: 'mastery',
    isUnlocked: false,
  },
  {
    id: 'plank-solid',
    title: 'Plank Precision',
    description: 'Complete a push-up set maintaining proper horizontal core alignment.',
    category: 'mastery',
    isUnlocked: false,
  },
  {
    id: 'streak-3',
    title: 'Consistency Ignition',
    description: 'Maintain an active workout streak of 3 consecutive days.',
    category: 'consistency',
    isUnlocked: false,
  },
  {
    id: 'streak-7',
    title: 'Unstoppable Momentum',
    description: 'Maintain an active workout streak of 7 consecutive days.',
    category: 'consistency',
    isUnlocked: false,
  },
  {
    id: 'clean-reps',
    title: 'Form Perfectionist',
    description: 'Complete a set where every single repetition has full range of motion.',
    category: 'mastery',
    isUnlocked: false,
  },
];

export class AchievementEvaluator {
  public evaluate(
    currentAchievements: Achievement[],
    completedSession: WorkoutSession,
    totalRepsLogged: number,
    streakDays: number
  ): { updatedAchievements: Achievement[]; newlyUnlocked: Achievement[] } {
    const list = currentAchievements.length > 0 ? [...currentAchievements] : [...INITIAL_ACHIEVEMENTS];
    const newlyUnlocked: Achievement[] = [];

    const unlock = (id: string) => {
      const item = list.find((a) => a.id === id);
      if (item && !item.isUnlocked) {
        item.isUnlocked = true;
        item.unlockedAt = Date.now();
        newlyUnlocked.push(item);
      }
    };

    // 1. First Workout
    unlock('first-workout');

    // 2. 100 Reps
    if (totalRepsLogged >= 100) {
      unlock('reps-100');
    }

    // 3. Exercise Specific Mastery
    for (const ex of completedSession.exercises) {
      if (ex.exerciseId === 'squat' && completedSession.averageFormScore >= 80) {
        unlock('squat-master');
      }
      if (ex.exerciseId === 'overhead-press' && ex.totalReps >= 8) {
        unlock('press-pro');
      }
      if (ex.exerciseId === 'pushup' && ex.totalReps >= 6) {
        unlock('plank-solid');
      }

      for (const set of ex.completedSets) {
        if (set.reps.length >= 6 && set.reps.every((r) => r.quality === 'Clean')) {
          unlock('clean-reps');
        }
      }
    }

    // 4. Streaks
    if (streakDays >= 3) {
      unlock('streak-3');
    }
    if (streakDays >= 7) {
      unlock('streak-7');
    }

    return { updatedAchievements: list, newlyUnlocked };
  }

  public compareSessions(current: WorkoutSession, previous?: WorkoutSession): SessionComparison {
    if (!previous || previous.totalReps === 0) {
      return {
        hasPrevious: false,
        repDiffPercent: 0,
        durationDiffPercent: 0,
        formScoreDiffPercent: 0,
        summaryInsight: 'Baseline session established. Future sessions will display progress comparison trends.',
      };
    }

    const repDiff = Math.round(((current.totalReps - previous.totalReps) / previous.totalReps) * 100);
    const durationDiff = Math.round(
      ((current.durationSeconds - previous.durationSeconds) / Math.max(1, previous.durationSeconds)) * 100
    );
    const formDiff = current.averageFormScore - previous.averageFormScore;

    let insight = '';
    if (repDiff > 0 && formDiff >= 0) {
      insight = `Progressive overload achieved: +${repDiff}% rep volume while maintaining form quality.`;
    } else if (repDiff > 0 && formDiff < 0) {
      insight = `Higher volume (+${repDiff}%), but watch form execution on fatigue reps (${formDiff}% score).`;
    } else if (repDiff <= 0 && formDiff > 0) {
      insight = `Enhanced form precision (+${formDiff}%) with controlled movement pacing.`;
    } else {
      insight = 'Consistent maintenance session completed.';
    }

    return {
      hasPrevious: true,
      repDiffPercent: repDiff,
      durationDiffPercent: durationDiff,
      formScoreDiffPercent: formDiff,
      summaryInsight: insight,
    };
  }
}

export const achievementEvaluator = new AchievementEvaluator();
