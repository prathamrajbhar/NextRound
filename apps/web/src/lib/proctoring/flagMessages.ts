import type { ToastVariant } from '@/contexts/ToastContext';

export interface FlagMessage {
  title: string;
  description: string;
  variant: ToastVariant;
}

export const PROCTORING_FLAG_MESSAGES: Record<string, FlagMessage> = {
  tab_hidden: {
    title: 'Tab Switch Detected',
    description: 'The assessment detected you leaving the tab. Please stay on this tab.',
    variant: 'error',
  },
  fullscreen_exit: {
    title: 'Fullscreen Exit Detected',
    description: 'You exited full-screen mode. Please return to full screen to continue.',
    variant: 'error',
  },
  window_blur: {
    title: 'Window Focus Lost',
    description: 'The assessment window lost focus. Please keep this window focused.',
    variant: 'error',
  },
  network_disconnected: {
    title: 'Connection Lost',
    description: 'Your network disconnected. Reconnecting to the proctoring session…',
    variant: 'error',
  },
  multiple_faces_detected: {
    title: 'Multiple People Detected',
    description: 'More than one person was detected in frame. Ensure only you are visible.',
    variant: 'error',
  },
  multiple_faces_persistent: {
    title: 'Persistent Multiple People',
    description: 'Multiple people remained in frame for several seconds. This may disqualify the assessment.',
    variant: 'error',
  },
  no_face_detected: {
    title: 'No Face Detected',
    description: 'Your face was not visible. Please return to the camera frame.',
    variant: 'error',
  },
  audio_stopped: {
    title: 'Microphone Interrupted',
    description: 'Your microphone track stopped. Please check your mic connection.',
    variant: 'error',
  },
  video_stopped: {
    title: 'Camera Interrupted',
    description: 'Your camera track stopped. Please check your camera connection.',
    variant: 'error',
  },
  audio_muted: {
    title: 'Microphone Muted',
    description: 'Your microphone was muted. Please unmute to continue the session.',
    variant: 'error',
  },
  video_muted: {
    title: 'Camera Disabled',
    description: 'Your camera was disabled. Please re-enable it for proctoring.',
    variant: 'error',
  },
  paste_activity: {
    title: 'Paste Detected',
    description: 'Copy-paste activity was recorded. This is monitored for integrity.',
    variant: 'error',
  },
  multiple_voices_detected: {
    title: 'Multiple Voices Detected',
    description: 'Background voices were detected. Please keep your environment quiet.',
    variant: 'error',
  },
  background_noise_high: {
    title: 'High Background Noise',
    description: 'Elevated background noise was detected. Please move to a quieter space.',
    variant: 'info',
  },
  sudden_noise_spike: {
    title: 'Sudden Noise Spike',
    description: 'A sudden loud sound was recorded by the proctoring system.',
    variant: 'info',
  },
};

export function getProctoringFlagMessage(kind: string): FlagMessage | null {
  return PROCTORING_FLAG_MESSAGES[kind] ?? null;
}
