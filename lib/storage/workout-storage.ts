import { UserGoal, UserProfile, WorkoutSession } from '../types/session';
import { achievementEvaluator, INITIAL_ACHIEVEMENTS } from './achievements';

const STORAGE_KEYS = {
  SESSIONS: 'motionbird_v1_sessions',
  PROFILE: 'motionbird_v1_profile',
  GOALS: 'motionbird_v1_goals',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
  goal: 'General Fitness',
  experienceLevel: 'Beginner',
  preferredDurationMinutes: 20,
  completedWorkoutsCount: 0,
  totalRepsLogged: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  personalRecords: {
    maxRepsInSet: { exerciseId: 'bicep-curl', exerciseName: 'Bicep Curl', reps: 0, date: '' },
    longestSessionMinutes: 0,
    highestFormScore: 0,
  },
  achievements: INITIAL_ACHIEVEMENTS,
};

const DEFAULT_GOALS: UserGoal[] = [
  {
    id: 'goal-1',
    title: 'Complete 3 Workouts',
    metricType: 'workouts',
    targetValue: 3,
    currentValue: 0,
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: 'goal-2',
    title: 'Log 100 Total Reps',
    metricType: 'reps',
    targetValue: 100,
    currentValue: 0,
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: 'goal-3',
    title: 'Build a 3-Day Streak',
    metricType: 'streak',
    targetValue: 3,
    currentValue: 0,
    completed: false,
    createdAt: Date.now(),
  },
];

class WorkoutStorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // SESSIONS
  public getSessions(): WorkoutSession[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to read sessions from localStorage:', e);
      return [];
    }
  }

  public getSessionById(id: string): WorkoutSession | undefined {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id);
  }

  public saveSession(session: WorkoutSession): void {
    if (!this.isBrowser()) return;
    try {
      const sessions = this.getSessions();

      // Compute comparison with prior completed session if not yet present
      if (session.status === 'completed' && !session.comparison) {
        const priorCompleted = sessions.find((s) => s.status === 'completed' && s.id !== session.id);
        session.comparison = achievementEvaluator.compareSessions(session, priorCompleted);
      }

      const existingIdx = sessions.findIndex((s) => s.id === session.id);

      if (existingIdx >= 0) {
        sessions[existingIdx] = session;
      } else {
        sessions.unshift(session);
      }

      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

      // Update user profile, PRs, achievements, and streaks on completed sessions
      if (session.status === 'completed') {
        this.syncProfileWithCompletedSession(session);
      }
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
  }

  // USER PROFILE
  public getProfile(): UserProfile {
    if (!this.isBrowser()) return DEFAULT_PROFILE;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return DEFAULT_PROFILE;
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        achievements: parsed.achievements && parsed.achievements.length > 0 ? parsed.achievements : INITIAL_ACHIEVEMENTS,
      };
    } catch (e) {
      console.warn('Failed to read profile from localStorage:', e);
      return DEFAULT_PROFILE;
    }
  }

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated = { ...current, ...updates };
    if (this.isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to write profile to localStorage:', e);
      }
    }
    return updated;
  }

  // GOALS
  public getGoals(): UserGoal[] {
    if (!this.isBrowser()) return DEFAULT_GOALS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOALS);
      return data ? JSON.parse(data) : DEFAULT_GOALS;
    } catch (e) {
      console.warn('Failed to read goals from localStorage:', e);
      return DEFAULT_GOALS;
    }
  }

  public saveGoals(goals: UserGoal[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Failed to save goals to localStorage:', e);
    }
  }

  // DATA EXPORT & IMPORT (Privacy & Data Portability)
  public exportDataAsJSON(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      sessions: this.getSessions(),
      goals: this.getGoals(),
    };
    return JSON.stringify(data, null, 2);
  }

  public exportDataAsCSV(): string {
    const sessions = this.getSessions();
    const headers = ['ID', 'Date', 'Name', 'Status', 'DurationSeconds', 'TotalReps', 'AverageFormScore', 'Exercises'];
    const rows = sessions.map((s) => {
      const date = new Date(s.startedAt).toISOString().split('T')[0];
      const exNames = s.exercises.map((e) => `${e.exerciseName} (${e.totalReps})`).join('; ');
      return [
        `"${s.id}"`,
        `"${date}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.status}"`,
        s.durationSeconds,
        s.totalReps,
        s.averageFormScore,
        `"${exNames.replace(/"/g, '""')}"`,
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  public importDataFromJSON(jsonString: string): boolean {
    if (!this.isBrowser()) return false;
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed.profile));
      }
      if (Array.isArray(parsed.sessions)) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(parsed.sessions));
      }
      if (Array.isArray(parsed.goals)) {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(parsed.goals));
      }
      return true;
    } catch (e) {
      console.error('Failed to import MotionBird backup:', e);
      return false;
    }
  }

  private syncProfileWithCompletedSession(session: WorkoutSession): void {
    const profile = this.getProfile();
    const todayStr = new Date().toISOString().split('T')[0];

    let newStreak = profile.currentStreakDays;
    if (profile.lastWorkoutDate) {
      const lastDate = new Date(profile.lastWorkoutDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak++;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(profile.longestStreakDays, newStreak);
    const sessionDurationMin = Math.round(session.durationSeconds / 60);

    // Evaluate Personal Records
    let maxRepsInSet = profile.personalRecords.maxRepsInSet;
    for (const ex of session.exercises) {
      for (const set of ex.completedSets) {
        if (set.completedReps > maxRepsInSet.reps) {
          maxRepsInSet = {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            reps: set.completedReps,
            date: todayStr,
          };
        }
      }
    }

    const longestSession = Math.max(profile.personalRecords.longestSessionMinutes, sessionDurationMin);
    const highestForm = Math.max(profile.personalRecords.highestFormScore, session.averageFormScore);
    const newTotalReps = profile.totalRepsLogged + session.totalReps;

    // Evaluate Achievements
    const { updatedAchievements } = achievementEvaluator.evaluate(
      profile.achievements || INITIAL_ACHIEVEMENTS,
      session,
      newTotalReps,
      newStreak
    );

    const updatedProfile: UserProfile = {
      ...profile,
      completedWorkoutsCount: profile.completedWorkoutsCount + 1,
      totalRepsLogged: newTotalReps,
      currentStreakDays: newStreak,
      longestStreakDays: longestStreak,
      lastWorkoutDate: todayStr,
      achievements: updatedAchievements,
      personalRecords: {
        maxRepsInSet,
        longestSessionMinutes: longestSession,
        highestFormScore: highestForm,
      },
    };

    this.updateProfile(updatedProfile);

    // Update Goals
    const goals = this.getGoals().map((g) => {
      let cur = g.currentValue;
      if (g.metricType === 'workouts') cur += 1;
      if (g.metricType === 'reps') cur += session.totalReps;
      if (g.metricType === 'streak') cur = newStreak;
      return {
        ...g,
        currentValue: cur,
        completed: cur >= g.targetValue,
      };
    });
    this.saveGoals(goals);
  }
}

export const workoutStorage = new WorkoutStorageService();
