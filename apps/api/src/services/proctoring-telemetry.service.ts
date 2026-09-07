import type { ProctoringEventInput } from './proctoring-policy.types';
import type { AggregatedTelemetry } from './proctoring-telemetry.types';

export * from './proctoring-telemetry.types';

function detectRapidWarnings(sortedEvents: ProctoringEventInput[]): boolean {
  const warningEvents = sortedEvents.filter((event) => event.severity === 'warning' || event.severity === 'high');
  for (let index = 0; index < warningEvents.length; index++) {
    let count = 1;
    const startTime = warningEvents[index].client_timestamp.getTime();
    for (let nextIndex = index + 1; nextIndex < warningEvents.length; nextIndex++) {
      if (warningEvents[nextIndex].client_timestamp.getTime() - startTime <= 30000) {
        count++;
      } else {
        break;
      }
    }
    if (count >= 3) {
      return true;
    }
  }
  return false;
}

export function aggregateProctoringMetrics(events: ProctoringEventInput[]): AggregatedTelemetry {
  const sortedEvents = [...events].sort(
    (first, second) => first.client_timestamp.getTime() - second.client_timestamp.getTime()
  );

  let hiddenStart: Date | null = null;
  let tabSwitchCount = 0;
  let totalHiddenDurationMs = 0;

  let exitStart: Date | null = null;
  let fullscreenExitCount = 0;
  let totalOutsideFullscreenMs = 0;

  let lastHeartbeatTime: Date | null = null;
  let maxHeartbeatGapMs = 0;

  let cameraStoppedAt: Date | null = null;
  let micStoppedAt: Date | null = null;
  let cameraOffDurationMs = 0;
  let micOffDurationMs = 0;

  let faceMissingStart: Date | null = null;
  let totalFaceMissingMs = 0;
  let faceMissingCount = 0;
  let multipleFacesStart: Date | null = null;
  let totalMultipleFacesMs = 0;
  let multipleFacesCount = 0;
  let multipleVoicesCount = 0;
  let backgroundNoiseHighCount = 0;
  let copyPasteActivityCount = 0;

  for (const event of sortedEvents) {
    if (event.kind === 'tab_hidden') {
      if (!hiddenStart) hiddenStart = event.client_timestamp;
    } else if (event.kind === 'tab_visible') {
      if (hiddenStart) {
        tabSwitchCount++;
        const duration = event.client_timestamp.getTime() - hiddenStart.getTime();
        totalHiddenDurationMs += Math.max(0, duration);
        hiddenStart = null;
      }
    } else if (event.kind === 'fullscreen_exit') {
      if (!exitStart) {
        exitStart = event.client_timestamp;
        fullscreenExitCount++;
      }
    } else if (event.kind === 'fullscreen_enter') {
      if (exitStart) {
        const duration = event.client_timestamp.getTime() - exitStart.getTime();
        totalOutsideFullscreenMs += Math.max(0, duration);
        exitStart = null;
      }
    } else if (event.kind === 'heartbeat') {
      if (lastHeartbeatTime) {
        const gap = event.client_timestamp.getTime() - lastHeartbeatTime.getTime();
        if (gap > maxHeartbeatGapMs) maxHeartbeatGapMs = gap;
      }
      lastHeartbeatTime = event.client_timestamp;
    } else if (event.kind === 'camera_stopped' || event.kind === 'video_stopped') {
      if (!cameraStoppedAt) cameraStoppedAt = event.client_timestamp;
    } else if (event.kind === 'camera_started' || event.kind === 'video_started') {
      if (cameraStoppedAt) {
        cameraOffDurationMs += Math.max(0, event.client_timestamp.getTime() - cameraStoppedAt.getTime());
        cameraStoppedAt = null;
      }
    } else if (event.kind === 'microphone_stopped' || event.kind === 'audio_stopped') {
      if (!micStoppedAt) micStoppedAt = event.client_timestamp;
    } else if (event.kind === 'microphone_started' || event.kind === 'audio_started') {
      if (micStoppedAt) {
        micOffDurationMs += Math.max(0, event.client_timestamp.getTime() - micStoppedAt.getTime());
        micStoppedAt = null;
      }
    } else if (event.kind === 'face_count_changed') {
      const payload = event.payload_json && typeof event.payload_json === 'object'
        ? (event.payload_json as Record<string, unknown>)
        : null;
      const newCount = typeof payload?.newFaceCount === 'number' ? payload.newFaceCount : 1;
      if (newCount === 0) {
        if (!faceMissingStart) {
          faceMissingStart = event.client_timestamp;
          faceMissingCount++;
        }
      } else if (faceMissingStart) {
        totalFaceMissingMs += Math.max(0, event.client_timestamp.getTime() - faceMissingStart.getTime());
        faceMissingStart = null;
      }

      if (newCount >= 2) {
        if (!multipleFacesStart) {
          multipleFacesStart = event.client_timestamp;
          multipleFacesCount++;
        }
      } else if (multipleFacesStart) {
        totalMultipleFacesMs += Math.max(0, event.client_timestamp.getTime() - multipleFacesStart.getTime());
        multipleFacesStart = null;
      }
    } else if (event.kind === 'no_face_detected') {
      if (!faceMissingStart) {
        faceMissingStart = event.client_timestamp;
        faceMissingCount++;
      }
    } else if (event.kind === 'multiple_faces_detected') {
      if (!multipleFacesStart) {
        multipleFacesStart = event.client_timestamp;
        multipleFacesCount++;
      }
    } else if (event.kind === 'multiple_voices_detected') {
      multipleVoicesCount++;
    } else if (event.kind === 'background_noise_high') {
      backgroundNoiseHighCount++;
    } else if (event.kind === 'copy_activity' || event.kind === 'paste_activity') {
      copyPasteActivityCount++;
    }
  }

  if (sortedEvents.length > 0) {
    const lastEventTime = sortedEvents[sortedEvents.length - 1].client_timestamp;
    if (hiddenStart) {
      tabSwitchCount++;
      totalHiddenDurationMs += Math.max(0, lastEventTime.getTime() - hiddenStart.getTime());
    }
    if (exitStart) {
      totalOutsideFullscreenMs += Math.max(0, lastEventTime.getTime() - exitStart.getTime());
    }
    if (cameraStoppedAt) {
      cameraOffDurationMs += Math.max(0, lastEventTime.getTime() - cameraStoppedAt.getTime());
    }
    if (micStoppedAt) {
      micOffDurationMs += Math.max(0, lastEventTime.getTime() - micStoppedAt.getTime());
    }
    if (faceMissingStart) {
      totalFaceMissingMs += Math.max(0, lastEventTime.getTime() - faceMissingStart.getTime());
    }
    if (multipleFacesStart) {
      totalMultipleFacesMs += Math.max(0, lastEventTime.getTime() - multipleFacesStart.getTime());
    }
  }

  return {
    sortedEvents,
    sessionStart: sortedEvents[0]?.client_timestamp || new Date(),
    sessionEnd: sortedEvents[sortedEvents.length - 1]?.client_timestamp || new Date(),
    tabSwitchCount,
    totalHiddenDurationMs,
    fullscreenExitCount,
    totalOutsideFullscreenMs,
    maxHeartbeatGapMs,
    cameraOffDurationMs,
    micOffDurationMs,
    totalFaceMissingMs,
    faceMissingCount,
    totalMultipleFacesMs,
    multipleFacesCount,
    multipleVoicesCount,
    backgroundNoiseHighCount,
    copyPasteActivityCount,
    hasRapidWarnings: detectRapidWarnings(sortedEvents),
  };
}
