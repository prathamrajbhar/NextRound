export interface WebRTCSignalMessage {
  type: 'description' | 'candidate' | 'ready' | 'ready_reply';
  description?: RTCSessionDescriptionInit | null;
  candidate?: RTCIceCandidateInit | null;
}

export interface WebRTCSignal {
  id: string;
  application_id: string;
  sender: string;
  message: WebRTCSignalMessage;
  created_at: string;
}

export interface UseWebRTCCallProps {
  applicationId: string;
  mode: 'hr-candidate' | 'hr-recruiter' | 'ai-voice' | 'mock-practice';
  localStream: MediaStream | null;
}

export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
