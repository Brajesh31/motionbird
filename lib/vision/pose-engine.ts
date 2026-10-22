import { Pose, Results } from '@mediapipe/pose';
import { PoseLandmark, PoseResults } from '../types/pose';

export interface PoseEngineConfig {
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  enableSegmentation?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export type PoseResultsCallback = (results: PoseResults) => void;

export class PoseEngine {
  private pose: Pose | null = null;
  private isInitialized: boolean = false;
  private isDestroyed: boolean = false;
  private onResultsCallback: PoseResultsCallback | null = null;

  constructor(private config: PoseEngineConfig = {}) {}

  /**
   * Initializes the MediaPipe Pose model asynchronously.
   */
  public async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PoseEngine can only be initialized in browser environments.');
    }

    if (this.isInitialized && this.pose) {
      return;
    }

    try {
      this.pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      this.pose.setOptions({
        modelComplexity: this.config.modelComplexity ?? 1,
        smoothLandmarks: this.config.smoothLandmarks ?? true,
        enableSegmentation: this.config.enableSegmentation ?? false,
        minDetectionConfidence: this.config.minDetectionConfidence ?? 0.5,
        minTrackingConfidence: this.config.minTrackingConfidence ?? 0.5,
      });

      this.pose.onResults((results: Results) => {
        if (this.isDestroyed) return;
        if (this.onResultsCallback) {
          this.onResultsCallback({
            poseLandmarks: results.poseLandmarks as unknown as PoseLandmark[],
            image: results.image,
          });
        }
      });

      // Warm up model
      await this.pose.initialize();
      this.isInitialized = true;
    } catch (error) {
      this.pose = null;
      this.isInitialized = false;
      throw new Error(`Failed to initialize MediaPipe Pose: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public setOnResults(callback: PoseResultsCallback): void {
    this.onResultsCallback = callback;
  }

  /**
   * Sends an image or video frame to the Pose model for inference.
   */
  public async send(image: HTMLVideoElement | HTMLCanvasElement): Promise<void> {
    if (!this.pose || !this.isInitialized || this.isDestroyed) {
      return;
    }
    try {
      await this.pose.send({ image });
    } catch (error) {
      // Ignore frame errors if engine was destroyed mid-flight
      if (!this.isDestroyed) {
        console.warn('PoseEngine send frame error:', error);
      }
    }
  }

  /**
   * Cleanly closes and releases the MediaPipe Pose instance and WebAssembly memory.
   */
  public close(): void {
    this.isDestroyed = true;
    this.isInitialized = false;
    this.onResultsCallback = null;

    if (this.pose) {
      try {
        this.pose.close();
      } catch (err) {
        console.warn('PoseEngine error during pose.close():', err);
      }
      this.pose = null;
    }
  }

  public get ready(): boolean {
    return this.isInitialized && !this.isDestroyed;
  }
}
