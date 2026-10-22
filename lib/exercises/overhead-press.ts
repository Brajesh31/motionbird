import {
  ExerciseContext,
  ExerciseDefinition,
  ExerciseProcessingResult,
  FormFeedback,
  MovementPhase,
  RepRecord,
} from '../types/exercise';
import { PoseLandmarkIndex } from '../types/pose';
import { calculateAngle, isPointAbove } from '../vision/geometry';
import { RepStateMachine } from '../state/rep-state-machine';

export class OverheadPressExercise implements ExerciseDefinition {
  public id = 'overhead-press';
  public name = 'Overhead Press';
  public category: 'upper_body' = 'upper_body';
  public description = 'Tracks bilateral overhead shoulder presses using vertical wrist displacement and elbow extension lockout angles.';
  public difficulty: 'Intermediate' = 'Intermediate';
  public targetMuscles = ['Anterior Deltoids', 'Lateral Deltoids', 'Triceps', 'Upper Pectorals', 'Trapezius'];
  public cameraOrientation: 'Front Facing' = 'Front Facing';
  public recommendedDistance = '6-8 ft (Torso and full arm extension above head visible)';
  public commonMistakes = [
    'Asymmetric press (one arm lagging behind or tilting the torso)',
    'Incomplete lockout (failing to extend elbows fully overhead)',
    'Pressing out in front rather than directly overhead',
  ];
  public instructions = [
    'Stand upright facing the camera with weights at clavicle/chin height.',
    'Press weights vertically upward overhead in a controlled, smooth path.',
    'Reach full elbow extension at the top directly over your shoulders.',
    'Lower under control back to shoulder rack level.',
  ];
  public minimumConfidence = 0.55;

  public requiredLandmarks = [
    PoseLandmarkIndex.NOSE,
    PoseLandmarkIndex.LEFT_SHOULDER,
    PoseLandmarkIndex.LEFT_ELBOW,
    PoseLandmarkIndex.LEFT_WRIST,
    PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.RIGHT_ELBOW,
    PoseLandmarkIndex.RIGHT_WRIST,
  ];

  private stateMachine: RepStateMachine;
  private totalReps: number = 0;
  private lastFeedbackTime: number = 0;

  constructor() {
    const thresholds = {
      startThreshold: 110,
      peakThreshold: 155,
      cleanPeakThreshold: 165,
      returnThreshold: 95,
      minimumRepDurationMs: 700,
      cooldownMs: 400,
      hysteresis: 6,
    };

    this.stateMachine = new RepStateMachine(thresholds, false);
  }

  public init(): void {
    this.reset();
  }

  public reset(): void {
    this.stateMachine.reset();
    this.totalReps = 0;
    this.lastFeedbackTime = 0;
  }

  public processFrame(context: ExerciseContext): ExerciseProcessingResult {
    const { smoothedLandmarks, timestamp, trackingConfidence } = context;

    const nose = smoothedLandmarks[PoseLandmarkIndex.NOSE];
    const lShoulder = smoothedLandmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const lElbow = smoothedLandmarks[PoseLandmarkIndex.LEFT_ELBOW];
    const lWrist = smoothedLandmarks[PoseLandmarkIndex.LEFT_WRIST];

    const rShoulder = smoothedLandmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const rElbow = smoothedLandmarks[PoseLandmarkIndex.RIGHT_ELBOW];
    const rWrist = smoothedLandmarks[PoseLandmarkIndex.RIGHT_WRIST];

    const leftAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const rightAngle = calculateAngle(rShoulder, rElbow, rWrist);
    const avgElbowAngle = (leftAngle + rightAngle) / 2;

    const isTrackingValid = trackingConfidence >= this.minimumConfidence;

    const areBothWristsAboveNose =
      isPointAbove(lWrist, nose, 0.04) && isPointAbove(rWrist, nose, 0.04);

    const pressMetric = areBothWristsAboveNose ? avgElbowAngle : Math.min(avgElbowAngle, 120);

    const smResult = this.stateMachine.update(pressMetric, timestamp, isTrackingValid);

    let isRepCompleted = false;
    let completedRep: RepRecord | undefined = undefined;

    if (smResult.isNewRep) {
      this.totalReps = smResult.repCount;
      isRepCompleted = true;
      completedRep = smResult.completedRep;
    }

    // Prioritized Form Feedback
    let feedback: FormFeedback | null = null;
    const canEmitFeedback = timestamp - this.lastFeedbackTime > 2500;

    if (canEmitFeedback && isTrackingValid && lWrist && rWrist) {
      const verticalWristDiff = Math.abs(lWrist.y - rWrist.y);

      // Priority 1: Press asymmetry (difference > 0.09)
      if (verticalWristDiff > 0.09 && smResult.phase === 'CONCENTRIC') {
        feedback = {
          id: `asymmetry-${timestamp}`,
          type: 'ASYMMETRIC_PRESS',
          severity: 'warning',
          priority: 'critical',
          message: 'Press both arms evenly — avoid tilting to one side.',
          timestamp,
          confidence: trackingConfidence,
          relatedLandmarks: [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.RIGHT_WRIST],
        };
        this.stateMachine.recordFault('Asymmetric Press');
        this.lastFeedbackTime = timestamp;
      }
      // Priority 2: Incomplete lockout (arms overhead but elbows bent < 145°)
      else if (areBothWristsAboveNose && avgElbowAngle < 145 && smResult.phase === 'CONCENTRIC') {
        feedback = {
          id: `lockout-hint-${timestamp}`,
          type: 'LOCKOUT_RANGE',
          severity: 'info',
          priority: 'important',
          message: 'Fully extend your arms to achieve complete lockout.',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      }
      // Priority 3: Solid lockout success
      else if (smResult.phase === 'PEAK' && areBothWristsAboveNose && avgElbowAngle >= 155) {
        feedback = {
          id: `lockout-${timestamp}`,
          type: 'GOOD_FORM',
          severity: 'success',
          priority: 'minor',
          message: 'Solid overhead lockout!',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      }
    }

    const romScore = Math.min(100, Math.max(0, Math.round(((avgElbowAngle - 85) / (160 - 85)) * 100)));

    return {
      reps: this.totalReps,
      phase: smResult.phase,
      isRepCompleted,
      completedRep,
      metrics: {
        primaryMetricLabel: 'Elbow Lockout',
        primaryMetricValue: `${Math.round(avgElbowAngle)}°`,
        secondaryMetricLabel: 'Wrist Position',
        secondaryMetricValue: areBothWristsAboveNose ? 'Overhead' : 'Rack Level',
        currentAngle: avgElbowAngle,
        rangeOfMotionScore: romScore,
        romDegrees: Math.round(Math.max(0, avgElbowAngle - 85)),
        concentricSeconds: Math.round((smResult.concentricMs / 1000) * 10) / 10,
        eccentricSeconds: Math.round((smResult.eccentricMs / 1000) * 10) / 10,
      },
      feedback,
      activeLandmarks: [
        PoseLandmarkIndex.LEFT_SHOULDER,
        PoseLandmarkIndex.LEFT_ELBOW,
        PoseLandmarkIndex.LEFT_WRIST,
        PoseLandmarkIndex.RIGHT_SHOULDER,
        PoseLandmarkIndex.RIGHT_ELBOW,
        PoseLandmarkIndex.RIGHT_WRIST,
        PoseLandmarkIndex.NOSE,
      ],
    };
  }
}
