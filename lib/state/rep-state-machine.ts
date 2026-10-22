import { MovementPhase, RepQuality, RepRecord } from '../types/exercise';

export interface StateMachineThresholds {
  startThreshold: number; // Angle/value that enters active movement
  peakThreshold: number; // Angle/value that must be reached for a full rep
  returnThreshold: number; // Angle/value that must be returned to to complete the rep
  minimumRepDurationMs?: number; // Rep must take at least this long
  cooldownMs?: number; // Minimum cooldown delay after a counted rep
  hysteresis?: number; // Noise band
  cleanPeakThreshold?: number; // Optional deeper threshold indicating exceptional form
}

export class RepStateMachine {
  private phase: MovementPhase = 'READY';
  private repCount: number = 0;
  private currentRepStartTime: number = 0;
  private peakInflectionTime: number = 0;
  private lastRepCompletedTime: number = 0;
  private peakValueReached: number = 0;
  private isDecreasingMovement: boolean;
  private recordedFaults: string[] = [];

  constructor(
    private thresholds: StateMachineThresholds,
    isDecreasingMovement: boolean = true
  ) {
    this.isDecreasingMovement = isDecreasingMovement;
    this.thresholds.minimumRepDurationMs = thresholds.minimumRepDurationMs ?? 450;
    this.thresholds.cooldownMs = thresholds.cooldownMs ?? 350;
    this.thresholds.hysteresis = thresholds.hysteresis ?? 5;
  }

  public recordFault(fault: string): void {
    if (!this.recordedFaults.includes(fault)) {
      this.recordedFaults.push(fault);
    }
  }

  public update(
    currentValue: number,
    timestamp: number,
    isTrackingValid: boolean
  ): {
    phase: MovementPhase;
    repCount: number;
    isNewRep: boolean;
    repDurationMs: number;
    completedRep?: RepRecord;
    concentricMs: number;
    eccentricMs: number;
  } {
    let isNewRep = false;
    let completedRep: RepRecord | undefined = undefined;

    // Safety: If tracking is lost or invalid, do not transition phases or count reps
    if (!isTrackingValid) {
      return {
        phase: this.phase,
        repCount: this.repCount,
        isNewRep: false,
        repDurationMs: this.currentRepStartTime > 0 ? timestamp - this.currentRepStartTime : 0,
        concentricMs: 0,
        eccentricMs: 0,
      };
    }

    const {
      startThreshold,
      peakThreshold,
      returnThreshold,
      minimumRepDurationMs = 450,
      cooldownMs = 350,
      hysteresis = 5,
      cleanPeakThreshold,
    } = this.thresholds;

    // Respect post-rep cooldown
    if (timestamp - this.lastRepCompletedTime < cooldownMs && this.phase === 'READY') {
      return {
        phase: 'READY',
        repCount: this.repCount,
        isNewRep: false,
        repDurationMs: 0,
        concentricMs: 0,
        eccentricMs: 0,
      };
    }

    if (this.isDecreasingMovement) {
      // Metric starts high (e.g. 160° extended arm or squat standing), drops to peak (e.g. 50° curl or 90° squat)
      switch (this.phase) {
        case 'IDLE':
        case 'READY':
          if (currentValue >= returnThreshold - hysteresis) {
            this.phase = 'READY';
          }
          if (currentValue < startThreshold - hysteresis) {
            this.phase = 'CONCENTRIC';
            this.currentRepStartTime = timestamp;
            this.peakInflectionTime = 0;
            this.peakValueReached = currentValue;
            this.recordedFaults = [];
          }
          break;

        case 'CONCENTRIC':
          if (currentValue < this.peakValueReached) {
            this.peakValueReached = currentValue;
          }

          if (currentValue <= peakThreshold) {
            this.phase = 'PEAK';
            this.peakInflectionTime = timestamp;
          } else if (currentValue > startThreshold + hysteresis) {
            // Aborted rep
            this.phase = 'READY';
            this.currentRepStartTime = 0;
          }
          break;

        case 'PEAK':
          if (currentValue < this.peakValueReached) {
            this.peakValueReached = currentValue;
          }
          if (currentValue > peakThreshold + hysteresis) {
            this.phase = 'ECCENTRIC';
            if (this.peakInflectionTime === 0) {
              this.peakInflectionTime = timestamp;
            }
          }
          break;

        case 'ECCENTRIC':
          if (currentValue >= returnThreshold - hysteresis) {
            const repDuration = timestamp - this.currentRepStartTime;

            if (repDuration >= minimumRepDurationMs) {
              this.repCount++;
              isNewRep = true;
              this.lastRepCompletedTime = timestamp;
              this.phase = 'VALID_REP';

              const concentricMs = this.peakInflectionTime > 0
                ? this.peakInflectionTime - this.currentRepStartTime
                : Math.round(repDuration * 0.5);
              const eccentricMs = repDuration - concentricMs;
              const romDegrees = Math.round(Math.abs(returnThreshold - this.peakValueReached));

              let quality: RepQuality = 'Good';
              if (cleanPeakThreshold !== undefined && this.peakValueReached <= cleanPeakThreshold && this.recordedFaults.length === 0) {
                quality = 'Clean';
              } else if (this.recordedFaults.length > 1 || romDegrees < Math.abs(returnThreshold - peakThreshold)) {
                quality = 'Partial';
              }

              completedRep = {
                repNumber: this.repCount,
                durationMs: Math.round(repDuration),
                concentricMs: Math.round(concentricMs),
                eccentricMs: Math.round(eccentricMs),
                romDegrees,
                quality,
                formFaults: [...this.recordedFaults],
                timestamp,
              };
            } else {
              this.phase = 'READY';
            }
          }
          break;

        case 'VALID_REP':
          this.phase = 'READY';
          this.currentRepStartTime = 0;
          break;
      }
    } else {
      // Metric starts low or standard, increases to peak (e.g. overhead press lockout)
      switch (this.phase) {
        case 'IDLE':
        case 'READY':
          if (currentValue <= returnThreshold + hysteresis) {
            this.phase = 'READY';
          }
          if (currentValue > startThreshold + hysteresis) {
            this.phase = 'CONCENTRIC';
            this.currentRepStartTime = timestamp;
            this.peakInflectionTime = 0;
            this.peakValueReached = currentValue;
            this.recordedFaults = [];
          }
          break;

        case 'CONCENTRIC':
          if (currentValue > this.peakValueReached) {
            this.peakValueReached = currentValue;
          }
          if (currentValue >= peakThreshold) {
            this.phase = 'PEAK';
            this.peakInflectionTime = timestamp;
          } else if (currentValue < startThreshold - hysteresis) {
            this.phase = 'READY';
            this.currentRepStartTime = 0;
          }
          break;

        case 'PEAK':
          if (currentValue > this.peakValueReached) {
            this.peakValueReached = currentValue;
          }
          if (currentValue < peakThreshold - hysteresis) {
            this.phase = 'ECCENTRIC';
            if (this.peakInflectionTime === 0) {
              this.peakInflectionTime = timestamp;
            }
          }
          break;

        case 'ECCENTRIC':
          if (currentValue <= returnThreshold + hysteresis) {
            const repDuration = timestamp - this.currentRepStartTime;
            if (repDuration >= minimumRepDurationMs) {
              this.repCount++;
              isNewRep = true;
              this.lastRepCompletedTime = timestamp;
              this.phase = 'VALID_REP';

              const concentricMs = this.peakInflectionTime > 0
                ? this.peakInflectionTime - this.currentRepStartTime
                : Math.round(repDuration * 0.5);
              const eccentricMs = repDuration - concentricMs;
              const romDegrees = Math.round(Math.abs(this.peakValueReached - returnThreshold));

              let quality: RepQuality = 'Good';
              if (cleanPeakThreshold !== undefined && this.peakValueReached >= cleanPeakThreshold && this.recordedFaults.length === 0) {
                quality = 'Clean';
              } else if (this.recordedFaults.length > 1) {
                quality = 'Partial';
              }

              completedRep = {
                repNumber: this.repCount,
                durationMs: Math.round(repDuration),
                concentricMs: Math.round(concentricMs),
                eccentricMs: Math.round(eccentricMs),
                romDegrees,
                quality,
                formFaults: [...this.recordedFaults],
                timestamp,
              };
            } else {
              this.phase = 'READY';
            }
          }
          break;

        case 'VALID_REP':
          this.phase = 'READY';
          this.currentRepStartTime = 0;
          break;
      }
    }

    const duration =
      this.currentRepStartTime > 0 && this.phase !== 'READY' && this.phase !== 'VALID_REP'
        ? timestamp - this.currentRepStartTime
        : 0;

    const concentricMs =
      this.peakInflectionTime > 0
        ? this.peakInflectionTime - this.currentRepStartTime
        : duration > 0 ? duration : 0;

    const eccentricMs =
      this.phase === 'ECCENTRIC' && this.peakInflectionTime > 0
        ? timestamp - this.peakInflectionTime
        : 0;

    return {
      phase: this.phase,
      repCount: this.repCount,
      isNewRep,
      repDurationMs: duration,
      completedRep,
      concentricMs,
      eccentricMs,
    };
  }

  public reset(): void {
    this.phase = 'READY';
    this.repCount = 0;
    this.currentRepStartTime = 0;
    this.peakInflectionTime = 0;
    this.lastRepCompletedTime = 0;
    this.peakValueReached = 0;
    this.recordedFaults = [];
  }

  public getRepCount(): number {
    return this.repCount;
  }

  public getPhase(): MovementPhase {
    return this.phase;
  }
}
