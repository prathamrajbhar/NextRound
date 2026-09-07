import { ProctoringEventLogger } from './proctoring.types';

export class ProctoringAudioMonitor {
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioIntervalId: ReturnType<typeof setInterval> | null = null;
  private audioStream: MediaStream | null = null;
  private backgroundNoiseFloor = 0;
  private lastAudioVolume = 0;
  private voiceActivityStreak = 0;
  private silenceStreak = 0;

  constructor(
    private logger: ProctoringEventLogger,
    private isPausedGetter: () => boolean
  ) {}

  start(stream: MediaStream): void {
    if (typeof window === 'undefined') return;
    if (this.audioIntervalId && this.audioStream === stream) return;
    if (this.audioIntervalId && this.audioStream && this.audioStream !== stream) {
      this.teardown();
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 512;
      source.connect(this.audioAnalyser);
      this.audioStream = stream;

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.audioIntervalId = setInterval(() => {
        if (this.isPausedGetter() || !this.audioAnalyser) return;
        this.audioAnalyser.getByteFrequencyData(dataArray);

        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const averageVolume = total / bufferLength;

        if (this.backgroundNoiseFloor === 0) {
          this.backgroundNoiseFloor = averageVolume;
        } else {
          this.backgroundNoiseFloor = this.backgroundNoiseFloor * 0.95 + averageVolume * 0.05;
        }

        let voiceBandEnergy = 0;
        let voiceBandCount = 0;
        const voiceStartBin = 2;
        const voiceEndBin = 35;
        for (let i = voiceStartBin; i <= voiceEndBin; i++) {
          voiceBandEnergy += dataArray[i];
          voiceBandCount++;
        }
        const avgVoiceEnergy = voiceBandEnergy / voiceBandCount;
        const signalToNoise = avgVoiceEnergy - this.backgroundNoiseFloor;
        const isVoicePresent = signalToNoise > 15 && avgVoiceEnergy > 20;

        if (isVoicePresent) {
          this.voiceActivityStreak++;
          this.silenceStreak = 0;
          if (this.voiceActivityStreak === 3) {
            this.logger.logEvent('voice_activity_detected', 'info', 'browser', {
              confidence: 0.85,
              voiceEnergy: avgVoiceEnergy,
              noiseFloor: this.backgroundNoiseFloor,
            });
          }
        } else {
          this.silenceStreak++;
          this.voiceActivityStreak = 0;
        }

        const volumeDiff = averageVolume - this.lastAudioVolume;
        if (volumeDiff > 35 && this.lastAudioVolume > 5) {
          this.logger.logEvent('sudden_noise_spike', 'warning', 'browser', {
            confidence: 0.9,
            prevVolume: this.lastAudioVolume,
            newVolume: averageVolume,
          });
        }
        this.lastAudioVolume = averageVolume;

        let peakCount = 0;
        for (let i = 2; i < bufferLength - 2; i++) {
          if (dataArray[i] > 30 && dataArray[i] > dataArray[i - 1] && dataArray[i] > dataArray[i + 1]) {
            peakCount++;
          }
        }

        if (isVoicePresent && peakCount >= 8) {
          this.logger.logEvent('multiple_voices_detected', 'warning', 'browser', {
            confidence: 0.75,
            peakCount,
            voiceEnergy: avgVoiceEnergy,
          });
        }

        if (!isVoicePresent && averageVolume > this.backgroundNoiseFloor + 25) {
          this.logger.logEvent('background_noise_high', 'info', 'browser', {
            confidence: 0.7,
            volume: averageVolume,
            noiseFloor: this.backgroundNoiseFloor,
          });
        }
      }, 1000);
    } catch {
      // Non-blocking Web Audio fallback
    }
  }

  teardown(): void {
    if (this.audioIntervalId) {
      clearInterval(this.audioIntervalId);
      this.audioIntervalId = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.audioAnalyser = null;
    this.audioStream = null;
    this.backgroundNoiseFloor = 0;
    this.lastAudioVolume = 0;
  }
}
