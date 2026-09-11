import type {
  ProctoringPolicy,
  ProctoringSummary,
  PolicyViolationResult,
  ProctoringEventInput,
} from './proctoring-policy.types';
import { aggregateProctoringMetrics } from './proctoring-telemetry.service';

export * from './proctoring-policy.types';
export * from './proctoring-telemetry.service';

export function evaluateSessionPolicy(
  policy: ProctoringPolicy,
  events: ProctoringEventInput[]
): { violations: PolicyViolationResult[]; summary: ProctoringSummary } {
  const violations: PolicyViolationResult[] = [];
  const metrics = aggregateProctoringMetrics(events);
  const { sessionStart, sessionEnd } = metrics;

  if (metrics.tabSwitchCount >= policy.hiddenReviewCount) {
    violations.push({
      rule_code: 'repeated_tab_switch',
      severity: 'medium',
      occurrence_count: metrics.tabSwitchCount,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  if (policy.fullscreenRequired && metrics.totalOutsideFullscreenMs > 0) {
    const totalSecs = metrics.totalOutsideFullscreenMs / 1000;
    if (totalSecs >= policy.outsideFullscreenReviewSeconds) {
      violations.push({
        rule_code: 'fullscreen_exit_review',
        severity: 'high',
        occurrence_count: metrics.fullscreenExitCount,
        first_seen_at: sessionStart,
        last_seen_at: sessionEnd,
      });
    } else if (totalSecs >= policy.outsideFullscreenWarningSeconds) {
      violations.push({
        rule_code: 'fullscreen_exit_warning',
        severity: 'low',
        occurrence_count: metrics.fullscreenExitCount,
        first_seen_at: sessionStart,
        last_seen_at: sessionEnd,
      });
    }
  }

  const maxGapSecs = metrics.maxHeartbeatGapMs / 1000;
  if (maxGapSecs >= policy.heartbeatReviewSeconds) {
    violations.push({
      rule_code: 'heartbeat_gap',
      severity: 'high',
      occurrence_count: Math.floor(maxGapSecs / policy.heartbeatIntervalSeconds) || 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  const camSecs = metrics.cameraOffDurationMs / 1000;
  const micSecs = metrics.micOffDurationMs / 1000;
  if (camSecs > 10 || micSecs > 10) {
    violations.push({
      rule_code: 'media_track_disabled',
      severity: 'medium',
      occurrence_count: (camSecs > 10 ? 1 : 0) + (micSecs > 10 ? 1 : 0),
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  const faceMissingSecs = metrics.totalFaceMissingMs / 1000;
  if (faceMissingSecs >= 10) {
    violations.push({
      rule_code: 'no_face_detected',
      severity: 'medium',
      occurrence_count: metrics.faceMissingCount || 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  const multipleFacesSecs = metrics.totalMultipleFacesMs / 1000;
  if (multipleFacesSecs >= 5) {
    violations.push({
      rule_code: 'multiple_faces_detected',
      severity: 'high',
      occurrence_count: metrics.multipleFacesCount || 1,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  if (metrics.multipleVoicesCount >= 2) {
    violations.push({
      rule_code: 'multiple_voices_detected',
      severity: 'medium',
      occurrence_count: metrics.multipleVoicesCount,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  if (metrics.copyPasteActivityCount >= 5) {
    violations.push({
      rule_code: 'copy_paste_abuse',
      severity: 'low',
      occurrence_count: metrics.copyPasteActivityCount,
      first_seen_at: sessionStart,
      last_seen_at: sessionEnd,
    });
  }

  if (metrics.hasRapidWarnings) {
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
      tabSwitchCount: metrics.tabSwitchCount,
      totalHiddenDurationMs: metrics.totalHiddenDurationMs,
      fullscreenExitCount: metrics.fullscreenExitCount,
      totalOutsideFullscreenMs: metrics.totalOutsideFullscreenMs,
      maxHeartbeatGapMs: metrics.maxHeartbeatGapMs,
      cameraOffDurationMs: metrics.cameraOffDurationMs,
      micOffDurationMs: metrics.micOffDurationMs,
      totalFaceMissingMs: metrics.totalFaceMissingMs,
      totalMultipleFacesMs: metrics.totalMultipleFacesMs,
      multipleVoicesCount: metrics.multipleVoicesCount,
      backgroundNoiseHighCount: metrics.backgroundNoiseHighCount,
      copyPasteActivityCount: metrics.copyPasteActivityCount,
      suspiciousBehaviorPattern: metrics.hasRapidWarnings,
    },
  };
}
