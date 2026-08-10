export interface ProctoringPolicy {
  version: string;
  fullscreenRequired: boolean;
  heartbeatIntervalSeconds: number;
  hiddenWarningCount: number;
  hiddenReviewCount: number;
  outsideFullscreenWarningSeconds: number;
  outsideFullscreenReviewSeconds: number;
  heartbeatReviewSeconds: number;
}

export interface ProctoringSummary {
  tabSwitchCount: number;
  totalHiddenDurationMs: number;
  fullscreenExitCount: number;
  totalOutsideFullscreenMs: number;
  maxHeartbeatGapMs: number;
  cameraOffDurationMs: number;
  micOffDurationMs: number;
  totalFaceMissingMs?: number;
  totalMultipleFacesMs?: number;
  multipleVoicesCount?: number;
  copyPasteActivityCount?: number;
  suspiciousBehaviorPattern?: boolean;
}

export interface PolicyViolationResult {
  rule_code: string;
  severity: 'low' | 'medium' | 'high';
  occurrence_count: number;
  first_seen_at: Date;
  last_seen_at: Date;
}

const DEFAULT_POLICY: ProctoringPolicy = {
  version: 'assessment-v1',
  fullscreenRequired: true,
  heartbeatIntervalSeconds: 10,
  hiddenWarningCount: 1,
  hiddenReviewCount: 4,
  outsideFullscreenWarningSeconds: 5,
  outsideFullscreenReviewSeconds: 30,
  heartbeatReviewSeconds: 120,
};

export function getPolicy(version?: string): ProctoringPolicy {
  if (version === 'assessment-v1') {
    return DEFAULT_POLICY;
  }
  return DEFAULT_POLICY;
}

export function evaluateSessionPolicy(
  policy: ProctoringPolicy,
  events: Array<{
    kind: string;
    client_timestamp: Date;
    session_elapsed_ms: number;
    payload_json: any;
  }>
): { violations: PolicyViolationResult[]; summary: ProctoringSummary } {
  const violations: PolicyViolationResult[] = [];

  // Sort events by client_timestamp ascending
  const sorted = [...events].sort(
    (a, b) => a.client_timestamp.getTime() - b.client_timestamp.getTime()
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

  for (const event of sorted) {
    // Visibility Changes
    if (event.kind === 'tab_hidden') {
      if (!hiddenStart) hiddenStart = event.client_timestamp;
    } else if (event.kind === 'tab_visible') {
      if (hiddenStart) {
        tabSwitchCount++;
        const duration = event.client_timestamp.getTime() - hiddenStart.getTime();
        totalHiddenDurationMs += Math.max(0, duration);
        hiddenStart = null;
      }
    }

    // Fullscreen Changes
    if (event.kind === 'fullscreen_exit') {
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
    }

    // Heartbeats
    if (event.kind === 'heartbeat') {
      if (lastHeartbeatTime) {
        const gap = event.client_timestamp.getTime() - lastHeartbeatTime.getTime();
        if (gap > maxHeartbeatGapMs) {
          maxHeartbeatGapMs = gap;
        }
      }
      lastHeartbeatTime = event.client_timestamp;
    }

    // Media permissions
    if (event.kind === 'camera_stopped' || event.kind === 'video_stopped') {
      if (!cameraStoppedAt) cameraStoppedAt = event.client_timestamp;
    } else if (event.kind === 'camera_started' || event.kind === 'video_started') {
      if (cameraStoppedAt) {
        cameraOffDurationMs += Math.max(0, event.client_timestamp.getTime() - cameraStoppedAt.getTime());
        cameraStoppedAt = null;
      }
    }

    if (event.kind === 'microphone_stopped' || event.kind === 'audio_stopped') {
      if (!micStoppedAt) micStoppedAt = event.client_timestamp;
    } else if (event.kind === 'microphone_started' || event.kind === 'audio_started') {
      if (micStoppedAt) {
        micOffDurationMs += Math.max(0, event.client_timestamp.getTime() - micStoppedAt.getTime());
        micStoppedAt = null;
      }
    }

    // Face detection tracking
    if (event.kind === 'face_count_changed') {
      const newCount = event.payload_json?.newFaceCount ?? 1;
      if (newCount === 0) {
        if (!faceMissingStart) {
          faceMissingStart = event.client_timestamp;
          faceMissingCount++;
        }
      } else {
        if (faceMissingStart) {
          totalFaceMissingMs += Math.max(0, event.client_timestamp.getTime() - faceMissingStart.getTime());
          faceMissingStart = null;
        }
      }

      if (newCount >= 2) {
        if (!multipleFacesStart) {
          multipleFacesStart = event.client_timestamp;
          multipleFacesCount++;
        }
      } else {
        if (multipleFacesStart) {
          totalMultipleFacesMs += Math.max(0, event.client_timestamp.getTime() - multipleFacesStart.getTime());
          multipleFacesStart = null;
        }
      }
    }

    if (event.kind === 'no_face_detected') {
      if (!faceMissingStart) {
        faceMissingStart = event.client_timestamp;
        faceMissingCount++;
      }
    } else if (event.kind === 'multiple_faces_detected') {
      if (!multipleFacesStart) {
        multipleFacesStart = event.client_timestamp;
        multipleFacesCount++;
      }
    }

    // Other events
    if (event.kind === 'multiple_voices_detected') {
      multipleVoicesCount++;
    }
    if (event.kind === 'background_noise_high') {
      backgroundNoiseHighCount++;
    }
    if (event.kind === 'copy_activity' || event.kind === 'paste_activity') {
      copyPasteActivityCount++;
    }
  }

  // Handle open intervals at the end of the session
  if (sorted.length > 0) {
    const lastEventTime = sorted[sorted.length - 1].client_timestamp;
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

  const sessionStart = sorted[0]?.client_timestamp || new Date();
  const sessionEnd = sorted[sorted.length - 1]?.client_timestamp || new Date();

  // Evaluate Policy Rules

  // Rule 1: Tab switches count check
  if (tabSwitchCount >= policy.hiddenReviewCount) {
    violations.push({
      rule_code: 'repeated_tab_switch',
      severity: 'medium',
      occurrence_count: tabSwitchCount,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 2: Outside fullscreen duration check
  if (policy.fullscreenRequired && totalOutsideFullscreenMs > 0) {
    const totalSecs = totalOutsideFullscreenMs / 1000;
    if (totalSecs >= policy.outsideFullscreenReviewSeconds) {
      violations.push({
        rule_code: 'fullscreen_exit_review',
        severity: 'high',
        occurrence_count: fullscreenExitCount,
        first_seen_at: sessionStart,
        last_seen_at: sessionEnd,
      });
    } else if (totalSecs >= policy.outsideFullscreenWarningSeconds) {
      violations.push({
        rule_code: 'fullscreen_exit_warning',
        severity: 'low',
        occurrence_count: fullscreenExitCount,
        first_seen_at: sessionStart,
        last_seen_at: sessionEnd,
      });
    }
  }

  // Rule 3: Heartbeat gap check
  const maxGapSecs = maxHeartbeatGapMs / 1000;
  if (maxGapSecs >= policy.heartbeatReviewSeconds) {
    violations.push({
      rule_code: 'heartbeat_gap',
      severity: 'high',
      occurrence_count: Math.floor(maxGapSecs / policy.heartbeatIntervalSeconds) || 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 4: Camera or microphone track disabled check
  const camSecs = cameraOffDurationMs / 1000;
  const micSecs = micOffDurationMs / 1000;
  if (camSecs > 10 || micSecs > 10) {
    violations.push({
      rule_code: 'media_track_disabled',
      severity: 'medium',
      occurrence_count: (camSecs > 10 ? 1 : 0) + (micSecs > 10 ? 1 : 0),
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 5: No Face Detected Duration
  const faceMissingSecs = totalFaceMissingMs / 1000;
  if (faceMissingSecs >= 10) {
    violations.push({
      rule_code: 'no_face_detected',
      severity: 'medium',
      occurrence_count: faceMissingCount || 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 6: Multiple Faces Detected Duration
  const multipleFacesSecs = totalMultipleFacesMs / 1000;
  if (multipleFacesSecs >= 5) {
    violations.push({
      rule_code: 'multiple_faces_detected',
      severity: 'high',
      occurrence_count: multipleFacesCount || 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 7: Multiple Voices Detected
  if (multipleVoicesCount >= 2) {
    violations.push({
      rule_code: 'multiple_voices_detected',
      severity: 'medium',
      occurrence_count: multipleVoicesCount,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 8: Copy/Paste Abuse
  if (copyPasteActivityCount >= 5) {
    violations.push({
      rule_code: 'copy_paste_abuse',
      severity: 'low',
      occurrence_count: copyPasteActivityCount,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  // Rule 9: Suspicious sliding-window rapid warning check
  // (3 warning/high events in a 30s window)
  const warningEvents = sorted.filter(e => e.severity === 'warning' || e.severity === 'high');
  let hasRapidWarnings = false;
  for (let i = 0; i < warningEvents.length; i++) {
    let count = 1;
    const tStart = warningEvents[i].client_timestamp.getTime();
    for (let j = i + 1; j < warningEvents.length; j++) {
      if (warningEvents[j].client_timestamp.getTime() - tStart <= 30000) {
        count++;
      } else {
        break;
      }
    }
    if (count >= 3) {
      hasRapidWarnings = true;
      break;
    }
  }

  if (hasRapidWarnings) {
    violations.push({
      rule_code: 'suspicious_behavior_pattern',
      severity: 'high',
      occurrence_count: 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  return {
    violations,
    summary: {
      tabSwitchCount,
      totalHiddenDurationMs,
      fullscreenExitCount,
      totalOutsideFullscreenMs,
      maxHeartbeatGapMs,
      cameraOffDurationMs,
      micOffDurationMs,
      totalFaceMissingMs,
      totalMultipleFacesMs,
      multipleVoicesCount,
      copyPasteActivityCount,
      suspiciousBehaviorPattern: hasRapidWarnings,
    },
  };
}
