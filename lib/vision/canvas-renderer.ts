import { PoseLandmark } from '../types/pose';

export const POSE_CONNECTIONS: [number, number][] = [
  // Upper body
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  // Torso
  [11, 23],
  [12, 24],
  [23, 24],
  // Legs
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  // Feet
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  [27, 31],
  [28, 32],
  // Hands
  [15, 17],
  [15, 19],
  [15, 21],
  [16, 18],
  [16, 20],
  [16, 22],
  // Face
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
];

export interface RenderOptions {
  mirrored?: boolean;
  activeLandmarks?: number[];
  showSkeleton?: boolean;
  accentColor?: string;
  activeColor?: string;
  skeletonColor?: string;
  lineWidth?: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('CanvasRenderer: Unable to obtain 2D rendering context');
    }
    this.ctx = context;
  }

  /**
   * Resizes the canvas to match the incoming video aspect ratio and pixel dimensions.
   */
  public setDimensions(width: number, height: number): void {
    if (width > 0 && height > 0) {
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
    }
  }

  /**
   * Renders a frame: paints video background, transforms coordinates for mirroring,
   * draws skeleton connectors, and highlights active exercise joints.
   */
  public render(
    image: CanvasImageSource,
    landmarks: PoseLandmark[] | undefined | null,
    options: RenderOptions = {}
  ): void {
    const {
      mirrored = true,
      activeLandmarks = [],
      showSkeleton = true,
      accentColor = '#00F2FE',
      activeColor = '#10B981',
      skeletonColor = 'rgba(79, 172, 254, 0.75)',
      lineWidth = 3,
    } = options;

    const width = this.canvas.width;
    const height = this.canvas.height;

    if (width === 0 || height === 0) return;

    this.ctx.save();

    // Coordinate transformation for consistent mirroring
    if (mirrored) {
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
    }

    // 1. Draw raw video feed
    this.ctx.drawImage(image, 0, 0, width, height);

    // Subtle dark vignette overlay for enhanced contrast
    this.ctx.fillStyle = 'rgba(8, 12, 20, 0.15)';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Draw Skeleton and Landmarks if present
    if (showSkeleton && landmarks && landmarks.length > 0) {
      this.drawConnectors(landmarks, POSE_CONNECTIONS, skeletonColor, lineWidth, width, height);
      this.drawLandmarks(landmarks, activeLandmarks, accentColor, activeColor, width, height);
    }

    this.ctx.restore();
  }

  private drawConnectors(
    landmarks: PoseLandmark[],
    connections: [number, number][],
    color: string,
    width: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of connections) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (!p1 || !p2) continue;
      if ((p1.visibility ?? 1.0) < 0.35 || (p2.visibility ?? 1.0) < 0.35) continue;

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * canvasWidth, p1.y * canvasHeight);
      this.ctx.lineTo(p2.x * canvasWidth, p2.y * canvasHeight);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawLandmarks(
    landmarks: PoseLandmark[],
    activeIndices: number[],
    baseColor: string,
    activeColor: string,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const activeSet = new Set(activeIndices);

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 1.0) < 0.35) continue;

      const x = lm.x * canvasWidth;
      const y = lm.y * canvasHeight;
      const isActive = activeSet.has(i);

      this.ctx.beginPath();
      if (isActive) {
        // Active exercise joint: vibrant glowing outer ring + solid core
        this.ctx.arc(x, y, 7, 0, 2 * Math.PI);
        this.ctx.fillStyle = activeColor;
        this.ctx.fill();
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.stroke();

        // Pulsing glow aura
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        this.ctx.fill();
      } else {
        // Standard skeletal landmark
        this.ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        this.ctx.fillStyle = baseColor;
        this.ctx.fill();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#080C14';
        this.ctx.stroke();
      }
    }
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
