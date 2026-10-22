import { PoseLandmark, TrackingQuality, TrackingStatus } from '../types/pose';
import { LandmarkSmoother, SmootherOptions } from './smoothing';

export interface LandmarkProcessorConfig {
  minimumVisibilityThreshold?: number;
  lowConfidenceThreshold?: number;
  smootherOptions?: SmootherOptions;
}

export class LandmarkProcessor {
  private smoother: LandmarkSmoother;
  private minimumVisibility: number;
  private lowConfidenceThreshold: number;
  private consecutiveLostFrames: number = 0;
  private consecutiveValidFrames: number = 0;

  constructor(config: LandmarkProcessorConfig = {}) {
    this.minimumVisibility = config.minimumVisibilityThreshold ?? 0.55;
    this.lowConfidenceThreshold = config.lowConfidenceThreshold ?? 0.45;
    this.smoother = new LandmarkSmoother(config.smootherOptions);
  }

  /**
   * Validates tracking quality against an arbitrary list of required landmarks.
   */
  public evaluateQuality(
    landmarks: PoseLandmark[] | undefined | null,
    requiredLandmarks: number[] = []
  ): TrackingQuality {
    if (!landmarks || landmarks.length === 0) {
      this.consecutiveLostFrames++;
      this.consecutiveValidFrames = 0;
      return {
        status: 'TRACKING_LOST',
        confidence: 0,
        missingLandmarks: requiredLandmarks,
        detectedLandmarkCount: 0,
      };
    }

    const missingLandmarks: number[] = [];
    let visibilitySum = 0;
    let checkedCount = 0;

    // Evaluate required landmarks specifically
    const indicesToCheck = requiredLandmarks.length > 0 ? requiredLandmarks : Array.from({ length: 33 }, (_, i) => i);

    for (const idx of indicesToCheck) {
      const lm = landmarks[idx];
      checkedCount++;

      if (
        !lm ||
        isNaN(lm.x) ||
        isNaN(lm.y) ||
        lm.x < -0.1 ||
        lm.x > 1.1 ||
        lm.y < -0.1 ||
        lm.y > 1.1
      ) {
        missingLandmarks.push(idx);
        continue;
      }

      const vis = lm.visibility ?? 1.0;
      visibilitySum += vis;

      if (vis < this.minimumVisibility) {
        missingLandmarks.push(idx);
      }
    }

    const avgConfidence = checkedCount > 0 ? visibilitySum / checkedCount : 0;

    let status: TrackingStatus = 'TRACKING';

    if (missingLandmarks.length > indicesToCheck.length * 0.4) {
      status = 'TRACKING_LOST';
      this.consecutiveLostFrames++;
      this.consecutiveValidFrames = 0;
    } else if (missingLandmarks.length > 0 || avgConfidence < this.lowConfidenceThreshold) {
      status = 'LOW_CONFIDENCE';
      this.consecutiveLostFrames = 0;
    } else {
      status = 'TRACKING';
      this.consecutiveLostFrames = 0;
      this.consecutiveValidFrames++;
    }

    return {
      status,
      confidence: Math.round(avgConfidence * 100) / 100,
      missingLandmarks,
      detectedLandmarkCount: landmarks.length,
    };
  }

  /**
   * Applies smoothing and validation to raw pose landmarks.
   */
  public process(
    rawLandmarks: PoseLandmark[] | undefined | null,
    requiredLandmarks: number[] = []
  ): {
    quality: TrackingQuality;
    smoothedLandmarks: PoseLandmark[];
    rawLandmarks: PoseLandmark[];
    isValidForRepEvaluation: boolean;
  } {
    const quality = this.evaluateQuality(rawLandmarks, requiredLandmarks);

    if (quality.status === 'TRACKING_LOST' || !rawLandmarks) {
      this.smoother.reset();
      return {
        quality,
        smoothedLandmarks: [],
        rawLandmarks: [],
        isValidForRepEvaluation: false,
      };
    }

    const smoothed = this.smoother.smooth(rawLandmarks);

    // Require at least 3 consecutive stable frames before considering pose valid for rep counting
    const isValidForRepEvaluation =
      quality.status === 'TRACKING' && this.consecutiveValidFrames >= 3;

    return {
      quality,
      smoothedLandmarks: smoothed,
      rawLandmarks,
      isValidForRepEvaluation,
    };
  }

  public reset(): void {
    this.smoother.reset();
    this.consecutiveLostFrames = 0;
    this.consecutiveValidFrames = 0;
  }
}
