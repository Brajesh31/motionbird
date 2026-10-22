export type CameraStatus =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE'
  | 'DISCONNECTED'
  | 'ERROR';

export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  mirrored: boolean;
  frameRate?: number;
}

export interface CameraState {
  status: CameraStatus;
  errorMessage?: string;
  videoWidth: number;
  videoHeight: number;
  isStreaming: boolean;
}
