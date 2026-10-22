import { Point2D, Point3D } from '../types/pose';

/**
 * Calculates the interior angle in degrees at vertex B formed by rays BA and BC.
 *
 * Geometric conventions:
 * - Coordinates are standard 2D normalized image space (x: [0, 1] left-to-right, y: [0, 1] top-to-bottom).
 * - The dot-product method is scale and translation invariant.
 * - Result is strictly clamped to [0.0, 180.0] degrees.
 *
 * Example:
 * - A fully extended arm (Shoulder A, Elbow B, Wrist C in a straight line) yields ~170°–180°.
 * - A tightly curled bicep yields ~30°–50°.
 * - A 90-degree bend at the joint yields 90°.
 */
export function calculateAngle(
  a: Point2D | Point3D,
  b: Point2D | Point3D,
  c: Point2D | Point3D
): number {
  if (!a || !b || !c) return 0;

  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magBA * magBC < 1e-7) {
    return 0;
  }

  const cosine = Math.min(Math.max(dot / (magBA * magBC), -1.0), 1.0);
  const angleRad = Math.acos(cosine);
  return (angleRad * 180.0) / Math.PI;
}

/**
 * Calculates the 2D Euclidean distance between two points in normalized image space.
 */
export function calculateDistance(a: Point2D, b: Point2D): number {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Determines whether point A is physically above point B in image coordinates.
 * In camera/canvas coordinates, y=0 is at the top of the screen and y=1 is at the bottom,
 * therefore point A is above point B if a.y < b.y.
 */
export function isPointAbove(a: Point2D, b: Point2D, threshold: number = 0): boolean {
  if (!a || !b) return false;
  return a.y < b.y - threshold;
}

/**
 * Calculates linear velocity in normalized units per second.
 */
export function calculateVelocity(
  current: Point2D,
  previous: Point2D,
  dtMs: number
): number {
  if (dtMs <= 0 || !current || !previous) return 0;
  const dist = calculateDistance(current, previous);
  return (dist / dtMs) * 1000.0;
}
