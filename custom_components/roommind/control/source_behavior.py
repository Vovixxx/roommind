"""Learned heat rate and coast time for each heating method.

The fixed profiles are the starting guess. A heating sample updates only the
method that was actually running. A coast sample updates how fast that
method's leftover heat fades. Cooling is its own method.
"""

from __future__ import annotations

import math


class SourceBehavior:
    """Per-method heating rate (°C/h) and coast time constant (minutes)."""

    def __init__(self, state: dict | None = None) -> None:
        saved = state or {}
        self.rates: dict[str, float] = {
            key: float(value) for key, value in (saved.get("rates") or {}).items() if _positive(value)
        }
        self.taus: dict[str, float] = {
            key: float(value) for key, value in (saved.get("taus") or {}).items() if _positive(value)
        }
        self._last: dict[str, tuple[float, float, str]] = {}
        self._coast: dict[str, tuple[str, float, float]] = {}
        self.dirty = False

    def export(self) -> dict:
        """Persist learned rates and coasts."""
        return {"rates": self.rates, "taus": self.taus}

    def rate(self, system: str) -> float | None:
        """Learned °C/h at full output, or None before the first sample."""
        value = self.rates.get(system)
        return value if value and value > 0 else None

    def tau(self, system: str, default: float) -> float:
        """Learned coast time constant, or the profile default."""
        value = self.taus.get(system)
        return value if value and value > 0 else default

    def observe(
        self,
        area_id: str,
        system: str,
        mode: str,
        temp: float | None,
        now: float,
        power: float,
    ) -> None:
        """Update the method that just ran, from one room-temperature step."""
        if temp is None:
            return
        previous = self._last.get(area_id)
        self._last[area_id] = (now, temp, mode)
        if previous is None:
            return
        prev_time, prev_temp, prev_mode = previous
        dt_hours = (now - prev_time) / 3600.0
        if dt_hours <= 0 or dt_hours > 1:
            return
        if mode == "heating" and system and power >= 0.2:
            observed = (temp - prev_temp) / dt_hours / power
            self._ema(self.rates, system, observed, low=0.1, high=30.0)
        elif mode == "cooling" and power >= 0.2:
            observed = (prev_temp - temp) / dt_hours / power
            self._ema(self.rates, "cooling", observed, low=0.1, high=30.0)
        if prev_mode == "heating" and mode != "heating" and system:
            self._coast[area_id] = (system, now, temp)
        coast = self._coast.get(area_id)
        if mode == "heating":
            self._coast.pop(area_id, None)
        elif coast is not None:
            coast_system, started, start_temp = coast
            minutes = (now - started) / 60.0
            drop = start_temp - temp
            if minutes >= 5 and drop >= 0.3:
                fraction = min(0.9, drop)
                tau = -minutes / math.log(1.0 - fraction)
                self._ema(self.taus, coast_system, tau, low=5.0, high=240.0)
                self._coast.pop(area_id, None)

    def _ema(self, store: dict[str, float], key: str, sample: float, *, low: float, high: float) -> None:
        if not math.isfinite(sample):
            return
        sample = min(high, max(low, sample))
        previous = store.get(key)
        store[key] = sample if previous is None else (0.8 * previous) + (0.2 * sample)
        self.dirty = True


def _positive(value: object) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value) and value > 0
