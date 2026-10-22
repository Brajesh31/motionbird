import {
  ExerciseContext,
  ExerciseDefinition,
  ExerciseProcessingResult,
  FormFeedback,
  MovementPhase,
  RepRecord,
} from '../types/exercise';
import { PoseLandmarkIndex } from '../types/pose';
import { calculateAngle } from '../vision/geometry';
import { RepStateMachine } from '../state/rep-state-machine';

export class PushUpExercise implements ExerciseDefinition {
  public id = 'pushup';
  public name = 'Push-up';
  public category: 'upper_body' = 'upper_body';
  public description = 'Tracks horizontal push-up repetitions, chest depth, and shoulder-hip-ankle body plank alignment.';
  public difficulty: 'Intermediate' = 'Intermediate';
  public targetMuscles = ['Pectoralis Major', 'Anterior Deltoids', 'Triceps', 'Core Stabilizers'];
  public cameraOrientation: 'Side Profile' = 'Side Profile';
  public recommendedDistance = '7-9 ft (Full horizontal body visible)';
  public commonMistakes = [
    'Sagging hips / loss of core tension',
    'Incomplete range of motion (not lowering chest close to floor)',
    'Flaring elbows out to 90 degrees instead of 45 degrees',
  ];
  public instructions = [
    'Position your camera at floor or knee height showing your side profile.',
    'Start in a high plank with hands slightly wider than shoulders and core braced.',
    'Lower your chest until elbows reach approximately 90 degrees.',
    'Push firmly through the floor to return to full arm lockout.',
  ];
  public minimumConfidence = 0.50;

  public requiredLandmarks = [
    PoseLandmarkIndex.LEFT_SHOULDER,
    PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.LEFT_ELBOW,
    PoseLandmarkIndex.RIGHT_ELBOW,
    PoseLandmarkIndex.LEFT_WRIST,
    PoseLandmarkIndex.RIGHT_WRIST,
    PoseLandmarkIndex.LEFT_HIP,
    PoseLandmarkIndex.RIGHT_HIP,
    PoseLandmarkIndex.LEFT_ANKLE,
    PoseLandmarkIndex.RIGHT_ANKLE,
  ];

  private stateMachine: RepStateMachine;
  private totalReps: number = 0;
  private lastFeedbackTime: number = 0;

  constructor() {
    // Elbow angle: starts ~160° (high plank), drops to <= 90° (chest down), returns to >= 150°
    const thresholds = {
      startThreshold: 140,
      peakThreshold: 90,
      cleanPeakThreshold: 75,
      returnThreshold: 150,
      minimumRepDurationMs: 650,
      cooldownMs: 400,
      hysteresis: 6,
    };

    // isDecreasingMovement = true (elbow angle decreases as chest lowers)
    this.stateMachine = new RepStateMachine(thresholds, true);
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

    const lShoulder = smoothedLandmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const rShoulder = smoothedLandmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const lElbow = smoothedLandmarks[PoseLandmarkIndex.LEFT_ELBOW];
    const rElbow = smoothedLandmarks[PoseLandmarkIndex.RIGHT_ELBOW];
    const lWrist = smoothedLandmarks[PoseLandmarkIndex.LEFT_WRIST];
    const rWrist = smoothedLandmarks[PoseLandmarkIndex.RIGHT_WRIST];
    const lHip = smoothedLandmarks[PoseLandmarkIndex.LEFT_HIP];
    const rHip = smoothedLandmarks[PoseLandmarkIndex.RIGHT_HIP];
    const lAnkle = smoothedLandmarks[PoseLandmarkIndex.LEFT_ANKLE];
    const rAnkle = smoothedLandmarks[PoseLandmarkIndex.RIGHT_ANKLE];

    // Determine primary side profile view
    const isLeftProfile = (lElbow?.visibility ?? 0) >= (rElbow?.visibility ?? 0);
    const shoulder = isLeftProfile ? lShoulder : rShoulder;
    const elbow = isLeftProfile ? lElbow : rElbow;
    const wrist = isLeftProfile ? lWrist : rWrist;
    const hip = isLeftProfile ? lHip : rHip;
    const ankle = isLeftProfile ? lAnkle : rAnkle;

    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
    const bodyPlankAngle = calculateAngle(shoulder, hip, ankle);

    // Orientation validation: check that user is in a horizontal prone position
    // (i.e. horizontal span shoulder-ankle is significant compared to vertical span)
    const isHorizontalPlank =
      shoulder && ankle
        ? Math.abs(shoulder.x - ankle.x) > 0.22 && Math.abs(shoulder.y - ankle.y) < 0.45
        : false;

    const isTrackingValid =
      trackingConfidence >= this.minimumConfidence &&
      elbowAngle > 0 &&
      isHorizontalPlank;

    const smResult = this.stateMachine.update(elbowAngle, timestamp, isTrackingValid);

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

    if (canEmitFeedback) {
      if (!isHorizontalPlank && trackingConfidence >= this.minimumConfidence) {
        feedback = {
          id: `orientation-${timestamp}`,
          type: 'POSITION_GUIDE',
          severity: 'info',
          priority: 'critical',
          message: 'Assume a horizontal push-up plank position facing the camera.',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      } else if (isTrackingValid) {
        // Priority 1: Plank alignment / sagging hips (body angle < 145°)
        if (bodyPlankAngle > 0 && bodyPlankAngle < 145) {
          feedback = {
            id: `plank-${timestamp}`,
            type: 'CORE_ALIGNMENT',
            severity: 'warning',
            priority: 'critical',
            message: 'Brace your core — keep your hips in line with your shoulders.',
            timestamp,
            confidence: trackingConfidence,
            relatedLandmarks: isLeftProfile
              ? [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_ANKLE]
              : [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_ANKLE],
          };
          this.stateMachine.recordFault('Hips Sagging');
          this.lastFeedbackTime = timestamp;
        }
        // Priority 2: Depth check (reversing without reaching 90°)
        else if (smResult.phase === 'CONCENTRIC' && elbowAngle > 90 && elbowAngle < 120) {
          feedback = {
            id: `depth-${timestamp}`,
            type: 'CHEST_DEPTH',
            severity: 'info',
            priority: 'important',
            message: 'Lower your chest closer to the floor for full range.',
            timestamp,
            confidence: trackingConfidence,
          };
          this.lastFeedbackTime = timestamp;
        }
        // Priority 3: Success
        else if (smResult.phase === 'PEAK' && elbowAngle <= 85) {
          feedback = {
            id: `good-depth-${timestamp}`,
            type: 'GOOD_FORM',
            severity: 'success',
            priority: 'minor',
            message: 'Great chest depth!',
            timestamp,
            confidence: trackingConfidence,
          };
          this.lastFeedbackTime = timestamp;
        }
      }
    }

    const romScore = Math.min(
      100,
      Math.max(0, Math.round(((160 - elbowAngle) / (160 - 85)) * 100))
    );

    return {
      reps: this.totalReps,
      phase: smResult.phase,
      isRepCompleted,
      completedRep,
      metrics: {
        primaryMetricLabel: 'Elbow Flexion',
        primaryMetricValue: elbowAngle > 0 ? `${Math.round(elbowAngle)}°` : '--',
        secondaryMetricLabel: 'Plank Line',
        secondaryMetricValue: bodyPlankAngle > 0 ? `${Math.round(bodyPlankAngle)}°` : '--',
        currentAngle: elbowAngle,
        rangeOfMotionScore: romScore,
        romDegrees: Math.round(160 - elbowAngle),
        concentricSeconds: Math.round((smResult.concentricMs / 1000) * 10) / 10,
        eccentricSeconds: Math.round((smResult.eccentricMs / 1000) * 10) / 10,
      },
      feedback,
      activeLandmarks: isLeftProfile
        ? [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_ANKLE]
        : [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_ANKLE],
    };
  }
}
