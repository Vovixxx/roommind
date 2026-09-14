# Hydronic-First Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an additive heat-source policy so a 1:1 hydronic + mini-split room can run radiator first and join the air plant only after a timed 2 °F shortfall, without changing RoomMind’s default efficiency picker.

**Architecture:** Keep `evaluate_heat_sources` as the pure planner and `HeatSourcePlan` / `async_apply` as the command path. Add `heat_source_policy` plus join/drop fields on the room. Efficiency stays the current outdoor + gap picker. `hydronic_first` / `air_first` ignore outdoor preference and large-gap “both”, and use a coordinator monotonic clock (`primary_on_since`) for the hold.

**Tech Stack:** Home Assistant custom component (Python 3.12), pytest, Lit/TypeScript panel, voluptuous websocket schema.

## Global Constraints

- Defaults stay RoomMind’s: omit `heat_source_policy` → `"efficiency"`; existing orchestrator tests must pass unchanged.
- Priority slider must not be read by the orchestrator.
- Internals stay °C. Default join 1.1 °C (≈ 2 °F), hold 30 minutes, drop hysteresis 0.3 °C (≈ 0.5 °F).
- Do not implement dual heads, prefer-cool basement, shared Carrier writer, extra plant types, or zone averaging.
- Cooling path stays as-is (ACs cool, thermostats off).
- i18n: every new UI string in `en.json`, `de.json`, and `fr.json`.
- Coverage must stay ≥ 95% (`pytest tests/ --cov=custom_components/roommind --cov-fail-under=95`).

**Spec:** `docs/superpowers/specs/2026-09-14-staging-feature-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `custom_components/roommind/const.py` | Policy names and join/drop defaults |
| `custom_components/roommind/store.py` | Persist new room fields |
| `custom_components/roommind/websocket_api.py` | Validate save-room payload |
| `custom_components/roommind/managers/heat_source_orchestrator.py` | Policy decision + timed join |
| `custom_components/roommind/coordinator.py` | Pass monotonic clock; keep `primary_on_since` |
| `tests/managers/test_heat_source_orchestrator.py` | Unit contract for all three policies |
| `tests/coordinator/test_heat_source.py` | Clock wiring / cleanup |
| `tests/test_store.py` / `tests/test_store_save_room.py` | Persist defaults |
| `frontend/src/types/index.ts` | Room config types |
| `frontend/src/components/rs-heat-source-section.ts` | Policy + join UI |
| `frontend/src/components/rs-room-detail.ts` | State, save, summary tile |
| `frontend/src/locales/{en,de,fr}.json` | Copy |
| `docs/control-and-devices.md` | User-facing behavior |
| `docs/townhouse/AGENT_BRIEFING.md` | Point §11 at this slice |

---

### Task 1: Persist policy and join fields

**Files:**
- Modify: `custom_components/roommind/const.py`
- Modify: `custom_components/roommind/store.py`
- Modify: `custom_components/roommind/websocket_api.py`
- Modify: `tests/test_store.py`
- Modify: `tests/test_store_save_room.py`

**Interfaces:**
- Consumes: existing room save path
- Produces: room dict keys `heat_source_policy`, `heat_source_join_delta`, `heat_source_join_hold_minutes`, `heat_source_drop_hysteresis` with the defaults below

- [ ] **Step 1: Write the failing store test**

Append to `tests/test_store.py` after `test_save_room_defaults_heat_source_orchestration`:

```python
@pytest.mark.asyncio
async def test_save_room_defaults_heat_source_policy(store):
    """New staging fields default to efficiency + 2°F/30 min join."""
    await store.async_load()
    room = await store.async_save_room("wohnzimmer", {})
    assert room["heat_source_policy"] == "efficiency"
    assert room["heat_source_join_delta"] == 1.1
    assert room["heat_source_join_hold_minutes"] == 30
    assert room["heat_source_drop_hysteresis"] == 0.3


@pytest.mark.asyncio
async def test_save_room_heat_source_policy_explicit_values(store):
    await store.async_load()
    room = await store.async_save_room(
        "wohnzimmer",
        {
            "heat_source_orchestration": True,
            "heat_source_policy": "hydronic_first",
            "heat_source_join_delta": 1.5,
            "heat_source_join_hold_minutes": 45,
            "heat_source_drop_hysteresis": 0.6,
        },
    )
    assert room["heat_source_policy"] == "hydronic_first"
    assert room["heat_source_join_delta"] == 1.5
    assert room["heat_source_join_hold_minutes"] == 45
    assert room["heat_source_drop_hysteresis"] == 0.6
```

Also extend the asserts in `tests/test_store_save_room.py` (`test_create_empty_room_all_defaults`) with the same four default checks.

- [ ] **Step 2: Run tests to verify they fail**

Run: `.venv/bin/pytest tests/test_store.py::test_save_room_defaults_heat_source_policy tests/test_store_save_room.py::test_create_empty_room_all_defaults -v`

Expected: FAIL with `KeyError: 'heat_source_policy'` (or similar).

- [ ] **Step 3: Add constants**

In `custom_components/roommind/const.py`, immediately after the existing heat-source block:

```python
HEAT_SOURCE_POLICY_EFFICIENCY = "efficiency"
HEAT_SOURCE_POLICY_HYDRONIC_FIRST = "hydronic_first"
HEAT_SOURCE_POLICY_AIR_FIRST = "air_first"
HEAT_SOURCE_POLICIES = [
    HEAT_SOURCE_POLICY_EFFICIENCY,
    HEAT_SOURCE_POLICY_HYDRONIC_FIRST,
    HEAT_SOURCE_POLICY_AIR_FIRST,
]
DEFAULT_HEAT_SOURCE_POLICY = HEAT_SOURCE_POLICY_EFFICIENCY
DEFAULT_HEAT_SOURCE_JOIN_DELTA = 1.1  # °C ≈ 2°F
DEFAULT_HEAT_SOURCE_JOIN_HOLD_MINUTES = 30
DEFAULT_HEAT_SOURCE_DROP_HYSTERESIS = 0.3  # °C ≈ 0.5°F
```

- [ ] **Step 4: Persist in store and websocket**

`store.py` imports: add `DEFAULT_HEAT_SOURCE_DROP_HYSTERESIS`, `DEFAULT_HEAT_SOURCE_JOIN_DELTA`, `DEFAULT_HEAT_SOURCE_JOIN_HOLD_MINUTES`, `DEFAULT_HEAT_SOURCE_POLICY`.

In the room dict built by `async_save_room` / `_normalize_room`, next to the existing heat-source keys:

```python
"heat_source_policy": config.get("heat_source_policy", DEFAULT_HEAT_SOURCE_POLICY),
"heat_source_join_delta": config.get(
    "heat_source_join_delta", DEFAULT_HEAT_SOURCE_JOIN_DELTA
),
"heat_source_join_hold_minutes": config.get(
    "heat_source_join_hold_minutes", DEFAULT_HEAT_SOURCE_JOIN_HOLD_MINUTES
),
"heat_source_drop_hysteresis": config.get(
    "heat_source_drop_hysteresis", DEFAULT_HEAT_SOURCE_DROP_HYSTERESIS
),
```

`websocket_api.py`: add the four names to `_ROOM_SAVE_FIELDS`. In the save-room schema:

```python
vol.Optional("heat_source_policy"): vol.In(
    ["efficiency", "hydronic_first", "air_first"]
),
vol.Optional("heat_source_join_delta"): vol.All(
    vol.Coerce(float), vol.Range(min=0.5, max=3.0)
),
vol.Optional("heat_source_join_hold_minutes"): vol.All(
    vol.Coerce(int), vol.Range(min=15, max=90)
),
vol.Optional("heat_source_drop_hysteresis"): vol.All(
    vol.Coerce(float), vol.Range(min=0.1, max=1.5)
),
```

- [ ] **Step 5: Run store tests**

Run: `.venv/bin/pytest tests/test_store.py tests/test_store_save_room.py -v`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add custom_components/roommind/const.py custom_components/roommind/store.py custom_components/roommind/websocket_api.py tests/test_store.py tests/test_store_save_room.py
git commit -m "feat: persist hydronic-first heat source policy fields"
```

---

### Task 2: Hydronic-first / air-first without timed join

Stage 1 always selected while heating is needed; stage 2 never (except fallback). Timed join is Task 3. Efficiency path must not change.

**Files:**
- Modify: `custom_components/roommind/managers/heat_source_orchestrator.py`
- Modify: `tests/managers/test_heat_source_orchestrator.py`

**Interfaces:**
- Consumes: `room_config["heat_source_policy"]` (default `"efficiency"`)
- Produces: `HeatSourcePlan.active_sources` of `"primary"` for hydronic-first heat demand when TRVs are available; `"secondary"` only if no primary devices remain

- [ ] **Step 1: Write failing tests**

Add to `tests/managers/test_heat_source_orchestrator.py`. Extend `_make_room` with `policy: str = "efficiency"` and set `"heat_source_policy": policy` on the returned dict.

```python
    def test_hydronic_first_mild_weather_keeps_primary(self):
        """Hydronic-first must not prefer the AC when outdoor is mild."""
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first", outdoor_threshold=5.0)
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.7, 19.0, 21.0, 12.0, "none", hass
        )
        assert result is not None
        assert result.active_sources == "primary"
        assert [c for c in result.commands if c.device_type == "thermostat"][0].active
        assert not [c for c in result.commands if c.device_type == "ac"][0].active

    def test_hydronic_first_large_gap_does_not_join_immediately(self):
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first")
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.8, 17.0, 21.0, -5.0, "none", hass
        )
        assert result is not None
        assert result.active_sources == "primary"

    def test_air_first_cold_weather_keeps_secondary_as_stage1(self):
        """Air-first: ACs are primary even when outdoor is cold (above AC min)."""
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="air_first", outdoor_threshold=5.0)
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.7, 19.0, 21.0, -5.0, "none", hass
        )
        assert result is not None
        assert result.active_sources == "secondary"
        assert [c for c in result.commands if c.device_type == "ac"][0].active
        assert not [c for c in result.commands if c.device_type == "thermostat"][0].active

    def test_efficiency_mild_weather_still_prefers_secondary(self):
        """Default policy is unchanged when the key is omitted."""
        hass = _make_hass(["heat", "cool"])
        room = _make_room()
        room.pop("heat_source_policy", None)
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.7, 19.0, 21.0, 12.0, "none", hass
        )
        assert result is not None
        assert result.active_sources == "secondary"
```

- [ ] **Step 2: Run new tests — expect FAIL**

Run: `.venv/bin/pytest tests/managers/test_heat_source_orchestrator.py::TestEvaluateHeatSources::test_hydronic_first_mild_weather_keeps_primary tests/managers/test_heat_source_orchestrator.py::TestEvaluateHeatSources::test_hydronic_first_large_gap_does_not_join_immediately -v`

Expected: FAIL (`active_sources == "secondary"` or `"both"`).

- [ ] **Step 3: Implement policy branch**

In `evaluate_heat_sources`, after devices are filtered for availability / AC heat / AC min outdoor, and **before** the efficiency `prefer_ac` / large-gap block:

```python
from ..const import (
    DEFAULT_HEAT_SOURCE_POLICY,
    HEAT_SOURCE_POLICY_AIR_FIRST,
    HEAT_SOURCE_POLICY_HYDRONIC_FIRST,
)

policy = room_config.get("heat_source_policy", DEFAULT_HEAT_SOURCE_POLICY)

if policy in (HEAT_SOURCE_POLICY_HYDRONIC_FIRST, HEAT_SOURCE_POLICY_AIR_FIRST):
    if policy == HEAT_SOURCE_POLICY_AIR_FIRST:
        primary_devices, secondary_devices = secondary_devices, primary_devices
    if delta_t <= 0:
        active = "none"
    elif primary_devices:
        active = "primary"
    elif secondary_devices:
        active = "secondary"
    else:
        active = "none"
    # Build commands with the (possibly swapped) lists, then return.
```

When roles are swapped for air-first, command `role` must follow the **device type after swap**: after the swap, `primary_devices` are ACs. Existing apply code keys off `device_type`, not `role`, so keep `device_type` as `"thermostat"` / `"ac"`. Keep `role` as `"primary"` for the stage-1 list and `"secondary"` for stage-2 so compressor-group filtering still matches `active_sources`.

**Air-first `active_sources` vocabulary:** today `"secondary"` means “ACs on, TRVs off.” Hero chip and `room_contributes_to_group` use that meaning. After a swap, if stage 1 is ACs, set `active = "secondary"` (ACs only) or `"primary"` (TRVs only) using **device type**, not the swapped list name.

Implement the staged policies in terms of device types to avoid that trap:

```python
if policy == HEAT_SOURCE_POLICY_HYDRONIC_FIRST:
    stage1, stage2 = primary_devices, secondary_devices  # TRV, AC
elif policy == HEAT_SOURCE_POLICY_AIR_FIRST:
    stage1, stage2 = secondary_devices, primary_devices  # AC, TRV
else:
    stage1 = stage2 = None

if stage1 is not None:
    if delta_t <= 0:
        active = "none"
        stage1_on = stage2_on = False
    elif stage1:
        stage1_on, stage2_on = True, False
    elif stage2:
        stage1_on, stage2_on = False, True
    else:
        stage1_on = stage2_on = False
    trv_on = stage1_on if policy == HEAT_SOURCE_POLICY_HYDRONIC_FIRST else stage2_on
    ac_on = stage2_on if policy == HEAT_SOURCE_POLICY_HYDRONIC_FIRST else stage1_on
    if trv_on and ac_on:
        active = "both"
    elif trv_on:
        active = "primary"
    elif ac_on:
        active = "secondary"
    else:
        active = "none"
    # build DeviceCommand list from original primary_devices / secondary_devices
    # using trv_on / ac_on, then return HeatSourcePlan(...)
```

Leave the existing efficiency block as the `else`.

- [ ] **Step 4: Run orchestrator tests**

Run: `.venv/bin/pytest tests/managers/test_heat_source_orchestrator.py -v`

Expected: PASS, including the original efficiency tests.

- [ ] **Step 5: Commit**

```bash
git add custom_components/roommind/managers/heat_source_orchestrator.py tests/managers/test_heat_source_orchestrator.py
git commit -m "feat: add hydronic-first and air-first heat source policies"
```

---

### Task 3: Timed join and drop hysteresis

**Files:**
- Modify: `custom_components/roommind/managers/heat_source_orchestrator.py`
- Modify: `tests/managers/test_heat_source_orchestrator.py`

**Interfaces:**
- Consumes: `now_monotonic: float | None`, `primary_on_since: float | None`, join fields on `room_config`
- Produces: `active_sources == "both"` (hydronic-first) only when hold elapsed and `delta_t >= join_delta`

- [ ] **Step 1: Write failing join tests**

```python
    def test_hydronic_first_joins_after_hold_when_still_short(self):
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first")
        room["heat_source_join_delta"] = 1.1
        room["heat_source_join_hold_minutes"] = 30
        now = 2_000.0
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.8, 19.5, 21.0, 12.0, "primary", hass,
            now_monotonic=now,
            primary_on_since=now - 30 * 60,
        )
        assert result is not None
        assert result.active_sources == "both"

    def test_hydronic_first_does_not_join_before_hold(self):
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first")
        now = 2_000.0
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.8, 19.5, 21.0, 12.0, "primary", hass,
            now_monotonic=now,
            primary_on_since=now - 10 * 60,
        )
        assert result is not None
        assert result.active_sources == "primary"

    def test_hydronic_first_does_not_join_if_gap_recovered(self):
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first")
        now = 2_000.0
        # 0.5 °C short < 1.1 join delta, hold already elapsed
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.5, 20.5, 21.0, 12.0, "primary", hass,
            now_monotonic=now,
            primary_on_since=now - 40 * 60,
        )
        assert result is not None
        assert result.active_sources == "primary"

    def test_hydronic_first_keeps_both_until_drop_hysteresis(self):
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first")
        room["heat_source_join_delta"] = 1.1
        room["heat_source_drop_hysteresis"] = 0.3
        now = 2_000.0
        # delta 0.9 is below join 1.1 but above 1.1-0.3=0.8
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.5, 20.1, 21.0, 12.0, "both", hass,
            now_monotonic=now,
            primary_on_since=now - 40 * 60,
        )
        assert result is not None
        assert result.active_sources == "both"

    def test_hydronic_first_drops_stage2_below_hysteresis(self):
        hass = _make_hass(["heat", "cool"])
        room = _make_room(policy="hydronic_first")
        room["heat_source_join_delta"] = 1.1
        room["heat_source_drop_hysteresis"] = 0.3
        now = 2_000.0
        result = evaluate_heat_sources(
            room, MODE_HEATING, 0.5, 20.3, 21.0, 12.0, "both", hass,
            now_monotonic=now,
            primary_on_since=now - 40 * 60,
        )
        assert result is not None
        assert result.active_sources == "primary"
```

Add `now_monotonic=None` and `primary_on_since=None` keyword-only args on `evaluate_heat_sources` first if the tests cannot even call it — that signature change can land in this step’s implementation.

- [ ] **Step 2: Run join tests — expect FAIL**

Run: `.venv/bin/pytest tests/managers/test_heat_source_orchestrator.py::TestEvaluateHeatSources::test_hydronic_first_joins_after_hold_when_still_short -v`

Expected: FAIL with `active_sources == "primary"`.

- [ ] **Step 3: Implement join/drop**

Change the signature:

```python
def evaluate_heat_sources(
    room_config: dict,
    mode: str,
    power_fraction: float,
    current_temp: float | None,
    target_temp: float | None,
    outdoor_temp: float | None,
    previous_active_sources: str,
    hass: HomeAssistant,
    *,
    now_monotonic: float | None = None,
    primary_on_since: float | None = None,
) -> HeatSourcePlan | None:
```

After hydronic/air-first has `stage1_on` true and `stage2` devices exist:

```python
from ..const import (
    DEFAULT_HEAT_SOURCE_DROP_HYSTERESIS,
    DEFAULT_HEAT_SOURCE_JOIN_DELTA,
    DEFAULT_HEAT_SOURCE_JOIN_HOLD_MINUTES,
)

join_delta = room_config.get("heat_source_join_delta", DEFAULT_HEAT_SOURCE_JOIN_DELTA)
hold_s = room_config.get(
    "heat_source_join_hold_minutes", DEFAULT_HEAT_SOURCE_JOIN_HOLD_MINUTES
) * 60
drop_h = room_config.get(
    "heat_source_drop_hysteresis", DEFAULT_HEAT_SOURCE_DROP_HYSTERESIS
)

hold_elapsed = (
    now_monotonic is not None
    and primary_on_since is not None
    and (now_monotonic - primary_on_since) >= hold_s
)
already_both = previous_active_sources == "both"
if already_both:
    stage2_on = delta_t > join_delta - drop_h
elif hold_elapsed and delta_t >= join_delta:
    stage2_on = True
else:
    stage2_on = False
```

If `now_monotonic` is missing, treat hold as not elapsed (fail closed: no join). Do not join on large gap without the clock.

Secondary power scale when `active == "both"` stays `HEAT_SOURCE_SECONDARY_POWER_SCALE` (existing).

- [ ] **Step 4: Run orchestrator tests**

Run: `.venv/bin/pytest tests/managers/test_heat_source_orchestrator.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add custom_components/roommind/managers/heat_source_orchestrator.py tests/managers/test_heat_source_orchestrator.py
git commit -m "feat: join secondary heat source after hold and shortfall"
```

---

### Task 4: Coordinator clock

**Files:**
- Modify: `custom_components/roommind/coordinator.py`
- Modify: `custom_components/roommind/diagnostics.py` (only if the dict type changes how diagnostics read state)
- Modify: `tests/coordinator/test_heat_source.py`

**Interfaces:**
- Consumes: `heat_source_plan.active_sources`, `time.monotonic()`
- Produces: per-room `primary_on_since` passed into the next `evaluate_heat_sources` call; cleared when orchestration is off, mode is not heating, plan is None, stage 1 is off, or the room is removed

Keep `_heat_source_states: dict[str, str]` so existing tests and live `active_heat_sources` stay stable. Add a parallel dict:

```python
self._heat_source_primary_on_since: dict[str, float] = {}
```

- [ ] **Step 1: Write failing coordinator tests**

In `tests/coordinator/test_heat_source.py`:

```python
    @pytest.mark.asyncio
    async def test_primary_on_since_starts_and_clears(self, hass, mock_config_entry):
        from custom_components.roommind.managers.heat_source_orchestrator import (
            HeatSourcePlan,
        )

        store = _make_store_mock({"living_room_abc12345": self.ROOM_WITH_BOTH})
        hass.data = {"roommind": {"store": store}}
        hass.states.get = MagicMock(side_effect=make_mock_states_get(temp="18.0"))
        hass.services.async_call = AsyncMock()

        plan_primary = HeatSourcePlan(commands=[], active_sources="primary", reason="t")
        with patch(
            "custom_components.roommind.coordinator.evaluate_heat_sources",
            return_value=plan_primary,
        ) as mock_evaluate:
            coordinator = _create_coordinator(hass, mock_config_entry)
            await coordinator._async_update_data()
            assert "living_room_abc12345" in coordinator._heat_source_primary_on_since
            first_ts = coordinator._heat_source_primary_on_since["living_room_abc12345"]
            await coordinator._async_update_data()
            assert coordinator._heat_source_primary_on_since["living_room_abc12345"] == first_ts
            kwargs = mock_evaluate.call_args.kwargs
            assert kwargs["primary_on_since"] == first_ts
            assert kwargs["now_monotonic"] is not None

        plan_none = HeatSourcePlan(commands=[], active_sources="none", reason="t")
        with patch(
            "custom_components.roommind.coordinator.evaluate_heat_sources",
            return_value=plan_none,
        ):
            await coordinator._async_update_data()
            assert "living_room_abc12345" not in coordinator._heat_source_primary_on_since
```

Also extend `test_async_room_removed_clears_heat_source_state` to assert the new dict is popped.

- [ ] **Step 2: Run — expect FAIL**

Run: `.venv/bin/pytest tests/coordinator/test_heat_source.py::TestHeatSourceOrchestration::test_primary_on_since_starts_and_clears -v`

Expected: FAIL (`AttributeError: _heat_source_primary_on_since` or unexpected keyword `now_monotonic`).

- [ ] **Step 3: Wire the clock**

`__init__`: `self._heat_source_primary_on_since: dict[str, float] = {}`

Replace the `evaluate_heat_sources(...)` call with:

```python
now = time.monotonic()
heat_source_plan = evaluate_heat_sources(
    room_config=room,
    mode=mode,
    power_fraction=power_fraction,
    current_temp=current_temp,
    target_temp=targets.heat,
    outdoor_temp=self.outdoor_temp_effective,
    previous_active_sources=self._heat_source_states.get(area_id, "none"),
    hass=self.hass,
    now_monotonic=now,
    primary_on_since=self._heat_source_primary_on_since.get(area_id),
)
if heat_source_plan is not None:
    self._heat_source_states[area_id] = heat_source_plan.active_sources
    stage1_on = heat_source_plan.active_sources in ("primary", "both")
    if room.get("heat_source_policy") == "air_first":
        stage1_on = heat_source_plan.active_sources in ("secondary", "both")
    if stage1_on:
        self._heat_source_primary_on_since.setdefault(area_id, now)
    else:
        self._heat_source_primary_on_since.pop(area_id, None)
else:
    self._heat_source_states.pop(area_id, None)
    self._heat_source_primary_on_since.pop(area_id, None)
```

On the existing `else` branch (orchestration not active) and in `async_room_removed`, also `pop` `_heat_source_primary_on_since`.

Do not encode policy in the coordinator beyond the stage-1 clock mapping above. Join math stays in the orchestrator.

- [ ] **Step 4: Run coordinator + orchestrator tests**

Run: `.venv/bin/pytest tests/coordinator/test_heat_source.py tests/managers/test_heat_source_orchestrator.py tests/managers/test_heat_source_integration.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add custom_components/roommind/coordinator.py tests/coordinator/test_heat_source.py
git commit -m "feat: track heat-source stage-1 runtime for timed join"
```

---

### Task 5: Panel UI and i18n

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/rs-heat-source-section.ts`
- Modify: `frontend/src/components/rs-room-detail.ts`
- Modify: `frontend/src/locales/en.json`
- Modify: `frontend/src/locales/de.json`
- Modify: `frontend/src/locales/fr.json`

**Interfaces:**
- Consumes: room fields from Task 1
- Produces: save payload including `heat_source_policy` and join fields; efficiency rooms still omit behavior change because default is `"efficiency"`

- [ ] **Step 1: Types and strings**

`frontend/src/types/index.ts` on `RoomConfig`:

```typescript
heat_source_policy?: "efficiency" | "hydronic_first" | "air_first";
heat_source_join_delta?: number;
heat_source_join_hold_minutes?: number;
heat_source_drop_hysteresis?: number;
```

Add to `en.json` (mirror in `de.json` / `fr.json`):

```json
"heat_source.policy": "Source priority",
"heat_source.policy_hint": "Efficiency uses outdoor temperature and gap (RoomMind default). Hydronic first always runs radiators first; air joins only after the wait if the room is still short. Air first reverses that order. The Control Priority slider does not choose the plant.",
"heat_source.policy_efficiency": "Efficiency (default)",
"heat_source.policy_hydronic_first": "Hydronic first",
"heat_source.policy_air_first": "Air first",
"heat_source.join_delta": "Join shortfall",
"heat_source.join_delta_hint": "Second plant may join when the room is still at least this far from the heat target (1.1 °C ≈ 2 °F).",
"heat_source.join_delta_suffix": "°C",
"heat_source.join_hold": "Join wait",
"heat_source.join_hold_hint": "First plant must run this long before the second may join.",
"heat_source.join_hold_suffix": "min",
"heat_source.drop_hysteresis": "Drop hysteresis",
"heat_source.drop_hysteresis_hint": "Second plant drops when the shortfall falls this far below the join shortfall (0.3 °C ≈ 0.5 °F).",
"heat_source.drop_hysteresis_suffix": "°C"
```

- [ ] **Step 2: Section component**

On `RsHeatSourceSection` add properties with defaults `policy = "efficiency"`, `joinDelta = 1.1`, `joinHoldMinutes = 30`, `dropHysteresis = 0.3`.

When `editing` and `enabled`:

- Render `ha-select` bound to `policy`, options efficiency / hydronic_first / air_first, emit `heat_source_policy`.
- If `policy === "efficiency"`: existing three threshold cells.
- Else: join delta (0.5–3.0, step 0.1), hold minutes (15–90, step 1), drop hysteresis (0.1–1.5, step 0.1), and keep the AC min outdoor cell.

Read-only summary:

- Disabled: existing `heat_source.summary_disabled`.
- Efficiency: existing three numbers.
- Other: policy label + join delta + hold + drop + AC min outdoor.

Follow existing `ha-select` usage in the panel (e.g. climate mode). Do not hardcode colors.

- [ ] **Step 3: Room detail wiring**

Add `@state()` fields and load/reset them next to the existing heat-source states (defaults `efficiency`, `1.1`, `30`, `0.3`). Pass them into both the tile and the edit dialog. Handle the four new keys in `_onHeatSourceSettingChanged`. Include them in `_doSave()`.

- [ ] **Step 4: Build frontend**

Run: `cd frontend && npm run build`

Expected: TypeScript check + Vite bundle succeed; `custom_components/roommind/frontend/roommind-panel.js` updates.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/components/rs-heat-source-section.ts frontend/src/components/rs-room-detail.ts frontend/src/locales/en.json frontend/src/locales/de.json frontend/src/locales/fr.json custom_components/roommind/frontend/roommind-panel.js
git commit -m "feat: add hydronic-first policy controls to heat source UI"
```

---

### Task 6: Docs and briefing pointer

**Files:**
- Modify: `docs/control-and-devices.md`
- Modify: `docs/townhouse/AGENT_BRIEFING.md`
- Modify: `FORK.md`

- [ ] **Step 1: Control guide**

Replace the Smart Source Selection section with:

- Same appearance gate (TRV + AC + external sensor).
- **Efficiency (default):** outdoor + gap; both when the gap is large. Unchanged.
- **Hydronic first:** radiators immediately; air heat joins after the wait if still short by the join delta; drops on hysteresis. Outdoor preference is ignored. AC min outdoor still protects the compressor.
- **Air first:** reverse plant order for heating.
- Priority slider still only changes MPC aggressiveness and does not pick the plant.

- [ ] **Step 2: Briefing + fork**

In `docs/townhouse/AGENT_BRIEFING.md` §11, keep the table but add under the table:

> 1:1 hydronic-first + timed join design: `docs/superpowers/specs/2026-09-14-staging-feature-design.md`. Dual heads, prefer-cool, and shared cool are still later.

In `FORK.md`, change the “do not implement a large hydronic-priority patch until trial unless they explicitly ask” sentence to: hydronic-first + timed join for 1:1 is the approved first code slice; later topologies still wait.

- [ ] **Step 3: Commit**

```bash
git add docs/control-and-devices.md docs/townhouse/AGENT_BRIEFING.md FORK.md
git commit -m "docs: describe hydronic-first heat source staging"
```

---

### Task 7: Full verification

- [ ] **Step 1: Backend**

Run: `.venv/bin/pytest tests/ -v --cov=custom_components/roommind --cov-report=term --cov-fail-under=95`

Expected: all tests PASS, coverage ≥ 95%.

- [ ] **Step 2: Frontend**

Run: `cd frontend && npm run build`

Expected: success.

- [ ] **Step 3: Manual 1:1 check (House B trial room, when HA is available)**

1. Room: radiator = Thermostat, mini-split = Climate Device, room sensor, Direct, smart source on, policy Hydronic first.
2. Call for heat ~2 °F below target: only radiator commanded.
3. After 30 minutes still short: both heat.
4. Cool: mini-split cool, radiator off.
5. A second room left on Efficiency still prefers AC when outdoor is mild.

If this environment has no Home Assistant instance, the pytest + frontend build are the gate; note HA live check as remaining house work.

---

## Spec coverage

| Spec section | Task |
| --- | --- |
| Efficiency unchanged | 2 (regression test), 1 (default) |
| Hydronic first stage 1 only | 2 |
| Timed join / drop | 3, 4 |
| Air first heating order | 2, 3 |
| AC min outdoor | existing orchestrator + keep field in UI (5) |
| Fallback if stage 1 missing | 2 |
| Clock reset | 4 |
| UI + i18n | 5 |
| Priority slider untouched | 5 copy + 6 docs |
| Cooling / off unchanged | no code; 6 docs |
| Out of scope topologies | 6 briefing pointer |
