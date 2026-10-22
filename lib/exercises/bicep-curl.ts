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

export class BicepCurlExercise implements ExerciseDefinition {
  public id = 'bicep-curl';
  public name = 'Bicep Curl';
  public category: 'upper_body' = 'upper_body';
  public description = 'Tracks bicep curl repetitions, arm kinematics, and elbow stabilization using shoulder-elbow-wrist joint angles.';
  public difficulty: 'Beginner' = 'Beginner';
  public targetMuscles = ['Biceps Brachii', 'Brachialis', 'Forearms'];
  public cameraOrientation: 'Front Facing' = 'Front Facing';
  public recommendedDistance = '5-7 ft (Upper body visible from head to hips)';
  public commonMistakes = [
    'Swinging elbows forward using shoulder momentum',
    'Incomplete eccentric lowering (cutting range of motion short)',
    'Excessive body rocking or swaying',
  ];
  public instructions = [
    'Stand upright facing the camera with arms extended at your sides.',
    'Keep your elbows pinned close to your ribcage.',
    'Curl hands upward smoothly toward shoulders until peak contraction.',
    'Lower under control back to full arm extension before initiating the next rep.',
  ];
  public minimumConfidence = 0.55;

  public requiredLandmarks = [
    PoseLandmarkIndex.LEFT_SHOULDER,
    PoseLandmarkIndex.LEFT_ELBOW,
    PoseLandmarkIndex.LEFT_WRIST,
    PoseLandmarkIndex.RIGHT_SHOULDER,
    PoseLandmarkIndex.RIGHT_ELBOW,
    PoseLandmarkIndex.RIGHT_WRIST,
  ];

  private leftStateMachine: RepStateMachine;
  private rightStateMachine: RepStateMachine;
  private totalReps: number = 0;
  private lastFeedbackTime: number = 0;

  constructor() {
    const thresholds = {
      startThreshold: 135,
      peakThreshold: 55,
      cleanPeakThreshold: 45,
      returnThreshold: 145,
      minimumRepDurationMs: 600,
      cooldownMs: 400,
      hysteresis: 6,
    };

    this.leftStateMachine = new RepStateMachine(thresholds, true);
    this.rightStateMachine = new RepStateMachine(thresholds, true);
  }

  public init(): void {
    this.reset();
  }

  public reset(): void {
    this.leftStateMachine.reset();
    this.rightStateMachine.reset();
    this.totalReps = 0;
    this.lastFeedbackTime = 0;
  }

  public processFrame(context: ExerciseContext): ExerciseProcessingResult {
    const { smoothedLandmarks, timestamp, trackingConfidence } = context;

    const lShoulder = smoothedLandmarks[PoseLandmarkIndex.LEFT_SHOULDER];
    const lElbow = smoothedLandmarks[PoseLandmarkIndex.LEFT_ELBOW];
    const lWrist = smoothedLandmarks[PoseLandmarkIndex.LEFT_WRIST];

    const rShoulder = smoothedLandmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
    const rElbow = smoothedLandmarks[PoseLandmarkIndex.RIGHT_ELBOW];
    const rWrist = smoothedLandmarks[PoseLandmarkIndex.RIGHT_WRIST];

    const leftAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const rightAngle = calculateAngle(rShoulder, rElbow, rWrist);

    const isTrackingValid = trackingConfidence >= this.minimumConfidence;

    const leftResult = this.leftStateMachine.update(leftAngle, timestamp, isTrackingValid);
    const rightResult = this.rightStateMachine.update(rightAngle, timestamp, isTrackingValid);

    let isRepCompleted = false;
    let completedRep: RepRecord | undefined = undefined;

    if (leftResult.isNewRep) {
      this.totalReps = this.leftStateMachine.getRepCount() + this.rightStateMachine.getRepCount();
      isRepCompleted = true;
      completedRep = leftResult.completedRep;
    } else if (rightResult.isNewRep) {
      this.totalReps = this.leftStateMachine.getRepCount() + this.rightStateMachine.getRepCount();
      isRepCompleted = true;
      completedRep = rightResult.completedRep;
    }

    const isLeftMoreActive = Math.abs(leftAngle - 180) > Math.abs(rightAngle - 180);
    const activeAngle = isLeftMoreActive ? leftAngle : rightAngle;
    const activeArmLabel = isLeftMoreActive ? 'Left Arm' : 'Right Arm';
    const activePhase: MovementPhase = isLeftMoreActive
      ? leftResult.phase
      : rightResult.phase;
    const activeSmResult = isLeftMoreActive ? leftResult : rightResult;

    // Prioritized Form evaluation
    let feedback: FormFeedback | null = null;
    const canEmitFeedback = timestamp - this.lastFeedbackTime > 2500;

    if (canEmitFeedback && isTrackingValid) {
      const activeElbow = isLeftMoreActive ? lElbow : rElbow;
      const activeShoulder = isLeftMoreActive ? lShoulder : rShoulder;

      // Priority 1: Elbow drift / swinging forward
      if (activeElbow && activeShoulder) {
        const horizontalDrift = Math.abs(activeElbow.x - activeShoulder.x);
        if (horizontalDrift > 0.14 && (activePhase === 'CONCENTRIC' || activePhase === 'PEAK')) {
          feedback = {
            id: `drift-${timestamp}`,
            type: 'ELBOW_STABILITY',
            severity: 'warning',
            priority: 'critical',
            message: 'Keep your elbow pinned to your side to isolate the bicep.',
            timestamp,
            confidence: trackingConfidence,
            relatedLandmarks: isLeftMoreActive
              ? [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_SHOULDER]
              : [PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_SHOULDER],
          };
          (isLeftMoreActive ? this.leftStateMachine : this.rightStateMachine).recordFault('Elbow Drift');
          this.lastFeedbackTime = timestamp;
        }
      }

      // Priority 2: Eccentric speed (lowering too rapidly < 0.3s)
      if (!feedback && activePhase === 'ECCENTRIC' && activeSmResult.eccentricMs > 0 && activeSmResult.eccentricMs < 300) {
        feedback = {
          id: `speed-${timestamp}`,
          type: 'TEMPO_CONTROL',
          severity: 'info',
          priority: 'important',
          message: 'Control the lowering phase — take 2 seconds down.',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      }

      // Priority 3: Peak contraction success
      if (!feedback && activePhase === 'PEAK' && activeAngle <= 55) {
        feedback = {
          id: `peak-${timestamp}`,
          type: 'GOOD_FORM',
          severity: 'success',
          priority: 'minor',
          message: 'Excellent peak contraction!',
          timestamp,
          confidence: trackingConfidence,
        };
        this.lastFeedbackTime = timestamp;
      }
    }

    const romScore = Math.min(
      100,
      Math.max(0, Math.round(((180 - activeAngle) / (180 - 55)) * 100))
    );

    return {
      reps: this.totalReps,
      phase: activePhase,
      isRepCompleted,
      completedRep,
      metrics: {
        primaryMetricLabel: `${activeArmLabel} Angle`,
        primaryMetricValue: `${Math.round(activeAngle)}°`,
        secondaryMetricLabel: 'L / R Reps',
        secondaryMetricValue: `${this.leftStateMachine.getRepCount()} | ${this.rightStateMachine.getRepCount()}`,
        currentAngle: activeAngle,
        rangeOfMotionScore: romScore,
        romDegrees: Math.round(180 - activeAngle),
        concentricSeconds: Math.round((activeSmResult.concentricMs / 1000) * 10) / 10,
        eccentricSeconds: Math.round((activeSmResult.eccentricMs / 1000) * 10) / 10,
      },
      feedback,
      activeLandmarks: isLeftMoreActive
        ? [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST]
        : [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST],
    };
  }
}
