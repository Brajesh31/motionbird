class VoiceCoachService {
  private isEnabled: boolean = false;
  private lastSpokenTime: number = 0;
  private minIntervalMs: number = 2200; // Throttle speech cues

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private speak(text: string, priority: boolean = false): void {
    if (!this.isEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const now = performance.now();
    if (!priority && now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Don't queue stale cues
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      this.lastSpokenTime = now;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fails silently if not supported or blocked
    }
  }

  public announceRep(count: number): void {
    // Announce every 5 reps or milestone reps to keep coaching unobtrusive
    if (count > 0 && (count % 5 === 0 || count === 10 || count === 12)) {
      this.speak(`${count} reps`);
    }
  }

  public announceFormCue(message: string): void {
    this.speak(message);
  }

  public announceSetComplete(setNum: number, restSeconds: number): void {
    this.speak(`Set ${setNum} complete. Rest ${restSeconds} seconds.`, true);
  }

  public announceRestComplete(): void {
    this.speak('Rest complete. Ready for next set.', true);
  }
}

export const voiceCoach = new VoiceCoachService();
