/**
 * Reusable Audio Manager for NextRound Speech & Voice Services.
 * Encapsulates pre-unlocking, blob-streaming, and SpeechSynthesis fallbacks.
 */

let globalAudioInstance: HTMLAudioElement | null = null;
let lastAudioUrl: string | null = null;
let lastText = '';

export function getAudioInstance(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    return {} as HTMLAudioElement;
  }
  if (!globalAudioInstance) {
    globalAudioInstance = new Audio();
  }
  return globalAudioInstance;
}

/**
 * Pre-unlocks audio context and element during a synchronous user gesture (click).
 */
export function unlockAudio() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      ctx.resume().then(() => ctx.close()).catch(() => {});
    }

    const audio = getAudioInstance();
    // Silent WAV file to authorize element playback
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP//';
    audio.play().then(() => audio.pause()).catch(() => {});

    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (err) {
    console.warn('Failed to pre-unlock audio:', err);
  }
}

/**
 * Converts a large base64 data URI to a blob URL to prevent engine format issues.
 */
export function dataUriToBlobUrl(dataUri: string): string {
  try {
    if (!dataUri.startsWith('data:')) return dataUri;
    const [header, base64Data] = dataUri.split(',');
    if (!base64Data) return dataUri;
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'audio/mp3';
    const binary = atob(base64Data);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('dataUriToBlobUrl conversion failed:', err);
    return dataUri;
  }
}

/**
 * Fallback SpeechSynthesis player
 */
export function playSpeechSynthesis(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
    );
    if (targetVoice) utterance.voice = targetVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnd) onEnd();
  }
}

/**
 * Play text via Neural base64 audio, falling back to local TTS.
 */
export function playAudio(text: string, audioUrl?: string, onEnd?: () => void) {
  lastText = text;
  if (audioUrl) {
    lastAudioUrl = audioUrl;
  }

  // Cancel any ongoing playbacks
  stopAudio();

  if (audioUrl) {
    try {
      const playableUrl = dataUriToBlobUrl(audioUrl);
      const audio = getAudioInstance();
      audio.src = playableUrl;
      audio.volume = 1.0;

      audio.onended = () => {
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        playSpeechSynthesis(text, onEnd);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playSpeechSynthesis(text, onEnd);
        });
      }
      return;
    } catch {
      playSpeechSynthesis(text, onEnd);
      return;
    }
  }

  playSpeechSynthesis(text, onEnd);
}

/**
 * Stops all playbacks.
 */
export function stopAudio() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel();
    if (globalAudioInstance) {
      try {
        globalAudioInstance.pause();
      } catch {}
    }
  }
}

/**
 * Replays the last played text/audio.
 */
export function replayLastAudio(onEnd?: () => void) {
  if (lastText) {
    playAudio(lastText, lastAudioUrl || undefined, onEnd);
  }
}
