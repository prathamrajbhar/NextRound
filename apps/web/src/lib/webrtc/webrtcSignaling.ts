import { apiClient } from '@/lib/apiClient';
import { WebRTCSignalMessage, WebRTCSignal } from './webrtc.types';

export async function postWebRTCSignal(
  applicationId: string,
  sender: 'candidate' | 'recruiter',
  message: WebRTCSignalMessage
): Promise<void> {
  try {
    await apiClient.post(`/interviews/${applicationId}/signal`, {
      sender,
      message,
    });
  } catch {
    // Signaling failure is non-blocking
  }
}

export async function processIncomingSignal(
  pc: RTCPeerConnection,
  data: WebRTCSignalMessage,
  polite: boolean,
  makingOfferRef: React.MutableRefObject<boolean>,
  ignoreOfferRef: React.MutableRefObject<boolean>,
  postSignalFn: (msg: WebRTCSignalMessage) => Promise<void>
): Promise<void> {
  const { type, description, candidate } = data;

  if (description) {
    const offerCollision =
      description.type === 'offer' &&
      (makingOfferRef.current || pc.signalingState !== 'stable');

    ignoreOfferRef.current = !polite && offerCollision;
    if (ignoreOfferRef.current) {
      return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(description));
    if (description.type === 'offer') {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await postSignalFn({
        type: 'description',
        description: pc.localDescription
          ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
          : null,
      });
    }
  } else if (candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      if (!ignoreOfferRef.current) {
        throw err;
      }
    }
  } else if (type === 'ready' || type === 'ready_reply') {
    if (!polite && pc.signalingState === 'stable') {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        await postSignalFn({
          type: 'description',
          description: pc.localDescription
            ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
            : null,
        });
      } finally {
        makingOfferRef.current = false;
      }
    } else if (polite && type === 'ready') {
      await postSignalFn({ type: 'ready_reply' });
    }
  }
}

export async function pollSignals(
  applicationId: string,
  lastPolledTime: Date
): Promise<{ signals: WebRTCSignal[]; latestTime: Date }> {
  try {
    const res = await apiClient.get<WebRTCSignal[]>(
      `/interviews/${applicationId}/signals?since=${lastPolledTime.toISOString()}`
    );
    if (res && Array.isArray(res) && res.length > 0) {
      const latestTime = new Date(res[res.length - 1].created_at);
      return { signals: res, latestTime };
    }
    return { signals: res || [], latestTime: lastPolledTime };
  } catch {
    return { signals: [], latestTime: lastPolledTime };
  }
}
