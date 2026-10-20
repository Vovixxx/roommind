"""Tests for per-method heating and cooling learning."""

from custom_components.roommind.control.source_behavior import SourceBehavior


def test_heating_sample_updates_only_that_method():
    behavior = SourceBehavior()
    behavior.observe("living", "underfloor", "heating", 20.0, 0.0, 1.0)
    behavior.observe("living", "underfloor", "heating", 20.5, 3600.0, 1.0)
    assert behavior.rate("underfloor") == 0.5
    assert behavior.rate("heat_pump") is None
    assert behavior.rate("cooling") is None


def test_cooling_sample_is_its_own_method():
    behavior = SourceBehavior()
    behavior.observe("living", "heat_pump", "cooling", 24.0, 0.0, 1.0)
    behavior.observe("living", "heat_pump", "cooling", 23.0, 3600.0, 1.0)
    assert behavior.rate("cooling") == 1.0
    assert behavior.rate("heat_pump") is None


def test_coast_replaces_the_fixed_tail():
    behavior = SourceBehavior()
    behavior.observe("living", "underfloor", "heating", 21.0, 0.0, 1.0)
    behavior.observe("living", "underfloor", "idle", 21.0, 60.0, 0.0)
    behavior.observe("living", "underfloor", "idle", 20.4, 60.0 + 20 * 60, 0.0)
    assert behavior.tau("underfloor", 90.0) != 90.0
    assert 5.0 <= behavior.tau("underfloor", 90.0) <= 240.0


def test_export_roundtrip():
    behavior = SourceBehavior()
    behavior.observe("living", "electric", "heating", 20.0, 0.0, 1.0)
    behavior.observe("living", "electric", "heating", 21.0, 3600.0, 1.0)
    restored = SourceBehavior(behavior.export())
    assert restored.rate("electric") == behavior.rate("electric")
