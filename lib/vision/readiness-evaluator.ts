import { ExerciseDefinition } from '../types/exercise';
import { PoseLandmark, TrackingQuality } from '../types/pose';
import { CameraState } from '../types/camera';

export interface ReadinessCheck {
  id: string;
  label: string;
  passed: boolean;
  hint?: string;
}

export interface TrackingReadiness {
  isReady: boolean;
  status: 'READY' | 'NOT_READY' | 'LOW_CONFIDENCE' | 'TRACKING_LOST';
  checks: ReadinessCheck[];
  guidanceMessage: string;
}

export class ReadinessEvaluator {
  public evaluate(
    cameraState: CameraState,
    quality: TrackingQuality,
    landmarks: PoseLandmark[] | undefined | null,
    exercise: ExerciseDefinition
  ): TrackingReadiness {
    const checks: ReadinessCheck[] = [];

    // Check 1: Camera Connected and Streaming
    const cameraPassed = cameraState.status === 'READY' && cameraState.isStreaming;
    checks.push({
      id: 'camera',
      label: 'Camera Active',
      passed: cameraPassed,
      hint: cameraPassed ? undefined : 'Camera stream initializing or permission required.',
    });

    // Check 2: Pose Detected
    const poseDetected = !!landmarks && landmarks.length >= 33 && quality.status !== 'TRACKING_LOST';
    checks.push({
      id: 'pose',
      label: 'Body Detected in Frame',
      passed: poseDetected,
      hint: poseDetected ? undefined : 'Step into the camera view.',
    });

    // Check 3: Exercise Key Landmarks Visible
    const requiredVisible =
      poseDetected &&
      quality.missingLandmarks.filter((idx) => exercise.requiredLandmarks.includes(idx)).length === 0;

    checks.push({
      id: 'landmarks',
      label: 'Required Joints Visible',
      passed: requiredVisible,
      hint: requiredVisible
        ? undefined
        : `Ensure ${exercise.targetMuscles.join(', ')} area is fully in view.`,
    });

    // Check 4: Distance & Framing (Checks if key joints are dangerously close to frame boundaries)
    let framingPassed = true;
    let framingHint: string | undefined = undefined;

    if (landmarks && landmarks.length > 0 && poseDetected) {
      for (const idx of exercise.requiredLandmarks) {
        const lm = landmarks[idx];
        if (lm) {
          if (lm.y < 0.04 || lm.y > 0.96 || lm.x < 0.04 || lm.x > 0.96) {
            framingPassed = false;
            framingHint = 'Move back slightly — joints are close to the frame edge.';
            break;
          }
        }
      }
    } else {
      framingPassed = false;
    }

    checks.push({
      id: 'framing',
      label: 'Framing & Distance Optimal',
      passed: framingPassed,
      hint: framingHint ?? exercise.recommendedDistance,
    });

    // Determine overall readiness
    const isReady = cameraPassed && poseDetected && requiredVisible && framingPassed;

    let status: TrackingReadiness['status'] = 'NOT_READY';
    let guidanceMessage = 'Position yourself in front of the camera to begin.';

    if (isReady) {
      status = 'READY';
      guidanceMessage = `Ready! Press "Start Set" to begin ${exercise.name}.`;
    } else if (!cameraPassed) {
      status = 'NOT_READY';
      guidanceMessage = 'Initializing camera stream...';
    } else if (!poseDetected) {
      status = 'TRACKING_LOST';
      guidanceMessage = 'Step back into frame so MotionBird can track your pose.';
    } else if (!requiredVisible) {
      status = 'LOW_CONFIDENCE';
      guidanceMessage = `Please step back so your ${exercise.name.toLowerCase()} movement path is fully visible.`;
    } else if (!framingPassed) {
      status = 'LOW_CONFIDENCE';
      guidanceMessage = framingHint || 'Adjust your distance from the camera.';
    }

    return {
      isReady,
      status,
      checks,
      guidanceMessage,
    };
  }
}

export const readinessEvaluator = new ReadinessEvaluator();
