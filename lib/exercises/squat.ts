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

export class SquatExercise implements ExerciseDefinition {
  public id = 'squat';
  public name = 'Bodyweight Squat';
  public category: 'lower_body' = 'lower_body';
  public description = 'Tracks hip-knee-ankle kinematic chain, squat depth, and torso posture during squats.';
  public difficulty: 'Beginner' = 'Beginner';
  public targetMuscles = ['Quadriceps', 'Gluteus Maximus', 'Hamstrings', 'Core'];
  public cameraOrientation: 'Side Profile' = 'Side Profile';
  public recommendedDistance = '7-9 ft (Full body visible from head to shoes)';
  public commonMistakes = [
    'Not squatting deep enough (reversing above parallel)',
    'Excessive forward torso lean / collapsing chest',
    'Rushing the descent without control',
  ];
  public instructions = [
    'Stand with feet shoulder-width apart, angled slightly outward.',
    'Initiate descent by hinging hips back and bending knees simultaneously.',
    'Descend until thighs are at least parallel to the floor (knee angle ~90°).',
    'Drive through your mid-foot to stand back up to full extension.',
  ];
  public minimumConfidence = 0.55;

  public requiredLandmarks = [
    PoseLandmarkIndex.LEFT_SHOULDER,
    PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.LEFT_HIP,
    PoseLandmarkIndex.RIGHT_HIP,
    PoseLandmarkIndex.LEFT_KNEE,
    PoseLandmarkIndex.RIGHT_KNEE,
    PoseLandmarkIndex.LEFT_ANKLE,
    PoseLandmarkIndex.RIGHT_ANKLE,
  ];

  private stateMachine: RepStateMachine;
  private totalReps: number = 0;
  private lastFeedbackTime: number = 0;

  constructor() {
    // Knee angle: starts ~170° (standing), drops to <= 95° (parallel depth), returns to >= 160°
    const thresholds = {
      startThreshold: 150,
      peakThreshold: 95,
      cleanPeakThreshold: 85,
      returnThreshold: 160,
      minimumRepDurationMs: 700,
      cooldownMs: 450,
      hysteresis: 6,
    };

    // isDecreasingMovement = true (angle decreases on descent)
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

    const lHip = smoothedLandmarks[PoseLandmarkIndex.LEFT_HIP];
    const rHip = smoothedLandmarks[PoseLandmarkIndex.RIGHT_HIP];
    const lKnee = smoothedLandmarks[PoseLandmarkIndex.LEFT_KNEE];
    const rKnee = smoothedLandmarks[PoseLandmarkIndex.RIGHT_KNEE];
    const lAnkle = smoothedLandmarks[PoseLandmarkIndex.LEFT_ANKLE];
    const rAnkle = smoothedLandmarks[PoseLandmarkIndex.RIGHT_ANKLE];
    const lShoulder = smoothedLandmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const rShoulder = smoothedLandmarks[PoseLandmarkIndex.RIGHT_SHOULDER];

    // Knee angles (Hip -> Knee -> Ankle)
    const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
    const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);

    // Determine primary leg based on visibility
    const isLeftMoreVisible = (lKnee?.visibility ?? 0) >= (rKnee?.visibility ?? 0);
    const activeKneeAngle = isLeftMoreVisible && leftKneeAngle > 0 ? leftKneeAngle : rightKneeAngle;

    // Torso pitch: Shoulder -> Hip -> Knee angle (indicates chest uprightness)
    const activeTorsoAngle = isLeftMoreVisible
      ? calculateAngle(lShoulder, lHip, lKnee)
      : calculateAngle(rShoulder, rHip, rKnee);

    const isTrackingValid = trackingConfidence >= this.minimumConfidence && activeKneeAngle > 0;

    const smResult = this.stateMachine.update(activeKneeAngle, timestamp, isTrackingValid);

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

    if (canEmitFeedback && isTrackingValid) {
      // Priority 1 (Critical): Excessive torso pitch / chest collapsing forward (angle < 65°)
      if (activeTorsoAngle > 0 && activeTorsoAngle < 65 && smResult.phase === 'CONCENTRIC') {
        feedback = {
          id: `torso-${timestamp}`,
          type: 'TORSO_POSTURE',
          severity: 'warning',
          priority: 'critical',
          message: 'Keep your chest up and torso more upright.',
          timestamp,
          confidence: trackingConfidence,
          relatedLandmarks: [
            isLeftMoreVisible ? PoseLandmarkIndex.LEFT_SHOULDER : PoseLandmarkIndex.RIGHT_SHOULDER,
            isLeftMoreVisible ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP,
          ],
        };
        this.stateMachine.recordFault('Chest Collapsed');
        this.lastFeedbackTime = timestamp;
      }
      // Priority 2 (Important): Depth check (reversing without reaching parallel)
      else if (smResult.phase === 'CONCENTRIC' && activeKneeAngle > 95 && activeKneeAngle < 125) {
        feedback = {
          id: `depth-${timestamp}`,
          type: 'SQUAT_DEPTH',
          severity: 'info',
          priority: 'important',
          message: 'Go a little deeper — aim for parallel thighs.',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      }
      // Priority 3 (Success): Reached deep parallel squat cleanly
      else if (smResult.phase === 'PEAK' && activeKneeAngle <= 90) {
        feedback = {
          id: `good-depth-${timestamp}`,
          type: 'GOOD_FORM',
          severity: 'success',
          priority: 'minor',
          message: 'Excellent squat depth!',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      }
    }

    const romScore = Math.min(
      100,
      Math.max(0, Math.round(((170 - activeKneeAngle) / (170 - 90)) * 100))
    );

    return {
      reps: this.totalReps,
      phase: smResult.phase,
      isRepCompleted,
      completedRep,
      metrics: {
        primaryMetricLabel: 'Knee Flexion',
        primaryMetricValue: `${Math.round(activeKneeAngle)}°`,
        secondaryMetricLabel: 'Torso Angle',
        secondaryMetricValue: activeTorsoAngle > 0 ? `${Math.round(activeTorsoAngle)}°` : '--',
        currentAngle: activeKneeAngle,
        rangeOfMotionScore: romScore,
        romDegrees: Math.round(170 - activeKneeAngle),
        concentricSeconds: Math.round((smResult.concentricMs / 1000) * 10) / 10,
        eccentricSeconds: Math.round((smResult.eccentricMs / 1000) * 10) / 10,
      },
      feedback,
      activeLandmarks: isLeftMoreVisible
        ? [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_SHOULDER]
        : [PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_KNEE, PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_SHOULDER],
    };
  }
}
