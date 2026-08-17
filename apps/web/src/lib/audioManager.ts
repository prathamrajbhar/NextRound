
let globalAudioInstance: HTMLAudioElement | null = null;
let lastAudioUrl: string | null = null;
let lastText = '';
let currentBlobUrl: string | null = null;

function revokeCurrentBlobUrl() {
  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {}
    currentBlobUrl = null;
  }
}

export function getAudioInstance(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    return {} as HTMLAudioElement;
  }
  if (!globalAudioInstance) {
    globalAudioInstance = new Audio();
  }
  return globalAudioInstance;
}

export function unlockAudio() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      ctx.resume().then(() => ctx.close()).catch(() => {});
    }

    const audio = getAudioInstance();

    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP//';
    audio.play().then(() => audio.pause()).catch(() => {});

    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (err) {
    console.warn('Failed to pre-unlock audio:', err);
  }
}

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

export function playAudio(text: string, audioUrl?: string, onEnd?: () => void) {
  lastText = text;
  if (audioUrl) {
    lastAudioUrl = audioUrl;
  }

  stopAudio();

  if (audioUrl) {
    try {
      revokeCurrentBlobUrl();
      const playableUrl = dataUriToBlobUrl(audioUrl);
      const audio = getAudioInstance();
      if (playableUrl !== audioUrl) {
        currentBlobUrl = playableUrl;
      }
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

export function stopAudio() {
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel();
    revokeCurrentBlobUrl();
    if (globalAudioInstance) {
      try {
        globalAudioInstance.pause();
        globalAudioInstance.src = '';
      } catch {}
    }
  }
}

export function replayLastAudio(onEnd?: () => void) {
  if (lastText) {
    playAudio(lastText, lastAudioUrl || undefined, onEnd);
  }
}
