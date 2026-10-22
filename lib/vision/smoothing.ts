import { PoseLandmark } from '../types/pose';
import { calculateDistance } from './geometry';

export interface SmootherOptions {
  alpha?: number; // Smoothing factor: 0 = static/frozen, 1 = raw (default: 0.65)
  maxJumpThreshold?: number; // Max allowable jump in normalized units per frame (default: 0.25)
}

export class LandmarkSmoother {
  private alpha: number;
  private maxJumpThreshold: number;
  private previousLandmarks: PoseLandmark[] | null = null;

  constructor(options: SmootherOptions = {}) {
    this.alpha = options.alpha ?? 0.65;
    this.maxJumpThreshold = options.maxJumpThreshold ?? 0.25;
  }

  public setAlpha(alpha: number): void {
    this.alpha = Math.max(0.05, Math.min(1.0, alpha));
  }

  public smooth(rawLandmarks: PoseLandmark[]): PoseLandmark[] {
    if (!rawLandmarks || rawLandmarks.length === 0) {
      this.previousLandmarks = null;
      return [];
    }

    if (!this.previousLandmarks || this.previousLandmarks.length !== rawLandmarks.length) {
      // First frame or topology change: initialize with raw values
      this.previousLandmarks = rawLandmarks.map((lm) => ({ ...lm }));
      return rawLandmarks;
    }

    const smoothed: PoseLandmark[] = new Array(rawLandmarks.length);

    for (let i = 0; i < rawLandmarks.length; i++) {
      const raw = rawLandmarks[i];
      const prev = this.previousLandmarks[i];

      // Jump guard: if a landmark teleports impossibly far in a single frame, reject the extreme jump
      const distance = calculateDistance(raw, prev);
      let targetX = raw.x;
      let targetY = raw.y;
      let targetZ = raw.z;

      if (distance > this.maxJumpThreshold) {
        // Dampen sudden jump by capping target displacement
        const scale = this.maxJumpThreshold / distance;
        targetX = prev.x + (raw.x - prev.x) * scale;
        targetY = prev.y + (raw.y - prev.y) * scale;
        targetZ = prev.z + (raw.z - prev.z) * scale;
      }

      // Exponential moving average filter
      const smX = this.alpha * targetX + (1.0 - this.alpha) * prev.x;
      const smY = this.alpha * targetY + (1.0 - this.alpha) * prev.y;
      const smZ = this.alpha * targetZ + (1.0 - this.alpha) * prev.z;
      const smVis =
        raw.visibility !== undefined && prev.visibility !== undefined
          ? this.alpha * raw.visibility + (1.0 - this.alpha) * prev.visibility
          : raw.visibility;

      smoothed[i] = {
        x: smX,
        y: smY,
        z: smZ,
        visibility: smVis,
      };
    }

    this.previousLandmarks = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.previousLandmarks = null;
  }
}
