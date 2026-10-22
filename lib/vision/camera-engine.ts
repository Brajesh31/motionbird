import { CameraConfig, CameraState, CameraStatus } from '../types/camera';

export type FrameCallback = (video: HTMLVideoElement) => Promise<void> | void;
export type StatusChangeCallback = (state: CameraState) => void;

export class CameraEngine {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isProcessingFrame: boolean = false;
  private config: CameraConfig;

  private state: CameraState = {
    status: 'IDLE',
    videoWidth: 0,
    videoHeight: 0,
    isStreaming: false,
  };

  private onFrameCallback: FrameCallback | null = null;
  private onStatusChangeCallback: StatusChangeCallback | null = null;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = {
      width: config.width ?? 1280,
      height: config.height ?? 720,
      facingMode: config.facingMode ?? 'user',
      mirrored: config.mirrored ?? true,
      frameRate: config.frameRate ?? 30,
    };
  }

  public setCallbacks(callbacks: {
    onFrame?: FrameCallback;
    onStatusChange?: StatusChangeCallback;
  }): void {
    if (callbacks.onFrame) this.onFrameCallback = callbacks.onFrame;
    if (callbacks.onStatusChange) this.onStatusChangeCallback = callbacks.onStatusChange;
  }

  private updateState(partialState: Partial<CameraState>): void {
    this.state = { ...this.state, ...partialState };
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.state);
    }
  }

  /**
   * Initializes the webcam stream and attaches it to the provided video element.
   */
  public async start(videoElement: HTMLVideoElement): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.updateState({
        status: 'UNAVAILABLE',
        errorMessage: 'MediaDevices API is not supported in this browser.',
      });
      return;
    }

    this.videoElement = videoElement;
    this.updateState({ status: 'INITIALIZING' });

    try {
      // Clean up any existing stream before starting a new one
      this.stopStream();

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          facingMode: this.config.facingMode,
          frameRate: { ideal: this.config.frameRate, max: 60 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;

      // Listen for camera disconnect or hardware track termination
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          this.updateState({
            status: 'DISCONNECTED',
            errorMessage: 'Camera device was disconnected or stopped externally.',
            isStreaming: false,
          });
        });
      }

      this.videoElement.srcObject = stream;
      this.videoElement.setAttribute('playsinline', 'true');
      this.videoElement.muted = true;

      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) return reject(new Error('Video element missing'));

        const onLoaded = () => {
          this.videoElement?.removeEventListener('loadedmetadata', onLoaded);
          this.videoElement
            ?.play()
            .then(() => resolve())
            .catch(reject);
        };

        if (this.videoElement.readyState >= 1) {
          this.videoElement
            .play()
            .then(() => resolve())
            .catch(reject);
        } else {
          this.videoElement.addEventListener('loadedmetadata', onLoaded);
        }
      });

      this.isRunning = true;
      const width = this.videoElement.videoWidth || this.config.width;
      const height = this.videoElement.videoHeight || this.config.height;

      this.updateState({
        status: 'READY',
        videoWidth: width,
        videoHeight: height,
        isStreaming: true,
      });

      this.startFrameLoop();
    } catch (err: unknown) {
      this.stopStream();
      const error = err as Error;

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.updateState({
          status: 'PERMISSION_DENIED',
          errorMessage: 'Camera permission is required to track movement. Please allow camera access in browser settings.',
        });
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        this.updateState({
          status: 'UNAVAILABLE',
          errorMessage: 'No camera hardware detected. Please connect a webcam.',
        });
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        this.updateState({
          status: 'ERROR',
          errorMessage: 'Camera is currently in use by another application.',
        });
      } else {
        this.updateState({
          status: 'ERROR',
          errorMessage: error.message || 'Failed to access camera.',
        });
      }
    }
  }

  private startFrameLoop(): void {
    const loop = async () => {
      if (!this.isRunning || !this.videoElement) return;

      if (
        this.videoElement.readyState >= 2 &&
        !this.videoElement.paused &&
        !this.videoElement.ended
      ) {
        if (!this.isProcessingFrame && this.onFrameCallback) {
          this.isProcessingFrame = true;
          try {
            await this.onFrameCallback(this.videoElement);
          } catch (e) {
            console.warn('Frame loop processing error:', e);
          } finally {
            this.isProcessingFrame = false;
          }
        }
      }

      if (this.isRunning) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Completely stops camera streaming, cancels animation loops, and cleans up resources.
   */
  public stop(): void {
    this.isRunning = false;
    this.isProcessingFrame = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.stopStream();
    this.videoElement = null;
    this.onFrameCallback = null;

    this.updateState({
      status: 'IDLE',
      isStreaming: false,
    });
  }

  public getState(): CameraState {
    return this.state;
  }
}
