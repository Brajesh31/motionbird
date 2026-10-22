import { PoseLandmark } from './pose';

export type MovementPhase =
  | 'IDLE'
  | 'READY'
  | 'STARTING'
  | 'ECCENTRIC'
  | 'INFLECTION'
  | 'CONCENTRIC'
  | 'PEAK'
  | 'VALID_REP'
  | 'RESET';

export type FormFeedbackSeverity = 'info' | 'warning' | 'error' | 'success';
export type FormFeedbackPriority = 'critical' | 'important' | 'minor';

export interface FormFeedback {
  id: string;
  type: string;
  severity: FormFeedbackSeverity;
  priority: FormFeedbackPriority;
  message: string;
  timestamp: number;
  confidence: number;
  relatedLandmarks?: number[];
}

export type RepQuality = 'Clean' | 'Good' | 'Partial';

export interface RepRecord {
  repNumber: number;
  durationMs: number;
  concentricMs: number;
  eccentricMs: number;
  romDegrees: number;
  quality: RepQuality;
  formFaults: string[];
  timestamp: number;
}

export interface ExerciseMetrics {
  primaryMetricLabel: string;
  primaryMetricValue: string | number;
  secondaryMetricLabel?: string;
  secondaryMetricValue?: string | number;
  currentAngle?: number;
  tempoSeconds?: number;
  concentricSeconds?: number;
  eccentricSeconds?: number;
  rangeOfMotionScore?: number; // 0-100%
  romDegrees?: number;
  angleBreakdown?: Record<string, number>;
}

export interface ExerciseContext {
  timestamp: number;
  smoothedLandmarks: PoseLandmark[];
  rawLandmarks: PoseLandmark[];
  trackingConfidence: number;
}

export interface ExerciseProcessingResult {
  reps: number;
  phase: MovementPhase;
  isRepCompleted: boolean;
  completedRep?: RepRecord;
  metrics: ExerciseMetrics;
  feedback?: FormFeedback | null;
  activeLandmarks: number[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: 'upper_body' | 'lower_body' | 'core' | 'full_body';
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscles: string[];
  cameraOrientation: 'Front Facing' | 'Side Profile' | '45° Angle';
  recommendedDistance: string;
  commonMistakes: string[];
  instructions: string[];
  requiredLandmarks: number[];
  minimumConfidence: number;
  init: () => void;
  reset: () => void;
  processFrame: (context: ExerciseContext) => ExerciseProcessingResult;
}
