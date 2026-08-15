import sys
import math

import numpy as np

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

from services.sentiment_service import (
    SAMPLING_RATE,
    _build_journey,
    _compute_pitch_metrics,
    _compute_timing_metrics,
    _derive_overall,
    _format_time,
    _window_scores,
)


def _word(start: float, end: float) -> dict:
    return {"word": "w", "start": start, "end": end}


def test_format_time():
    assert _format_time(0) == "00:00"
    assert _format_time(65) == "01:05"
    assert _format_time(600.9) == "10:00"


def test_timing_metrics_rate_and_pauses():
    words = [
        _word(0.0, 0.3),
        _word(0.4, 0.7),
        _word(2.0, 2.3),
        _word(2.4, 2.7),
    ]
    metrics = _compute_timing_metrics(words)
    assert metrics is not None
    assert abs(metrics["speakingRateWpm"] - 4 / (2.7 / 60)) < 1.0
    assert abs(metrics["avgPauseDurationSec"] - 1.3) < 0.01
    assert metrics["longPauseCount"] == 0
    assert abs(metrics["pausesPerMinute"] - 1 / (2.7 / 60)) < 1.0


def test_timing_metrics_long_pause_detection():
    words = [
        _word(0.0, 0.3),
        _word(4.0, 4.3),
    ]
    metrics = _compute_timing_metrics(words)
    assert metrics is not None
    assert metrics["longPauseCount"] == 1
    assert abs(metrics["avgPauseDurationSec"] - 3.7) < 0.01


def test_timing_metrics_empty_words():
    assert _compute_timing_metrics([]) is None


def test_pitch_metrics_on_sine_wave():
    t = np.arange(SAMPLING_RATE) / SAMPLING_RATE
    wave = (0.5 * np.sin(2 * np.pi * 150 * t)).astype(np.float32)
    metrics = _compute_pitch_metrics(wave)
    assert metrics is not None
    assert abs(metrics["pitchMeanHz"] - 150) < 150 * 0.05
    assert metrics["steadyPercent"] >= 90
    assert metrics["tremorPercent"] <= 10


def test_pitch_metrics_rejects_silence():
    wave = np.zeros(SAMPLING_RATE, dtype=np.float32)
    assert _compute_pitch_metrics(wave) is None


def test_derive_overall_optimal_rate_low_stress():
    pitch = {"tremorPercent": 0, "steadyPercent": 100}
    timing = {"speakingRateWpm": 135, "pausesPerMinute": 6}
    overall = _derive_overall(pitch, timing)
    assert 5 <= overall["stressScore"] <= 25
    assert 75 <= overall["confidenceScore"] <= 95
    assert 60 <= overall["clarityScore"] <= 95
    assert overall["tone"] in {"calm", "steady", "anxious", "stressed"}


def test_derive_overall_extreme_features_high_stress():
    pitch = {"tremorPercent": 100, "steadyPercent": 0}
    timing = {"speakingRateWpm": 80, "pausesPerMinute": 30}
    overall = _derive_overall(pitch, timing)
    assert overall["stressScore"] > 60
    assert overall["confidenceScore"] < 40
    assert overall["clarityScore"] < 45


def test_derive_overall_clamps_to_percent_range():
    pitch = {"tremorPercent": 200, "steadyPercent": -100}
    timing = {"speakingRateWpm": 5, "pausesPerMinute": 999}
    overall = _derive_overall(pitch, timing)
    assert 0 <= overall["stressScore"] <= 100
    assert 0 <= overall["confidenceScore"] <= 100
    assert 0 <= overall["clarityScore"] <= 100


def test_window_scores_labels():
    calm = {"speakingRateWpm": 135, "pausesPerMinute": 4}
    stressed = {"speakingRateWpm": 70, "pausesPerMinute": 30}
    hesitant = {"speakingRateWpm": 135, "pausesPerMinute": 24}
    _, _, _, calm_label = _window_scores(calm)
    stress, confidence, _, stressed_label = _window_scores(stressed)
    _, _, hesitation, hesitant_label = _window_scores(hesitant)
    assert calm_label == "Confident"
    assert stressed_label == "Stressed"
    assert stress > 60
    assert confidence < 40
    assert hesitant_label == "Hesitant"
    assert hesitation > 45


def test_build_journey_windows():
    words = [_word(i * 5.0, i * 5.0 + 1.0) for i in range(26)]
    journey = _build_journey(words)
    assert len(journey) == 3
    assert journey[0]["timeLabel"] == "00:00"
    assert journey[1]["timeLabel"] == "01:00"
    assert journey[2]["timeLabel"] == "02:00"
    assert journey[0]["emotionLabel"] in {"Confident", "Neutral", "Hesitant", "Stressed"}
    assert 0 <= journey[0]["confidence"] <= 100
    assert 0 <= journey[0]["stress"] <= 100