# Hydronic-first staging — design

**Product spec:** [docs/townhouse/AGENT_BRIEFING.md](../../townhouse/AGENT_BRIEFING.md). This file is the implementation design for the first code slice of §8 staging / §11 items 1 + timed join. It does not reopen locked house decisions.

**Not in this slice:** dual heads, House A basement prefer-cool, open-floor zone averaging, extra plant types (`switch`, Crestron floor SP), shared Carrier cool writer, hardwood floor max, weather-compensated floor targets.

---

## 1. Review — what RoomMind does today

Smart source selection lives in `custom_components/roommind/managers/heat_source_orchestrator.py`. The coordinator calls it only when all of these are true:

- room `heat_source_orchestration` is on
- mode is heating
- the room has an external temperature sensor
- the room has at least one thermostat (TRV / radiator) **and** at least one climate device (AC / mini-split)

Roles are **labels only**: thermostats = `primary`, ACs = `secondary`. The **policy** is efficiency routing:

| Condition | Result |
| --- | --- |
| `delta_t <= 0` | neither source |
| gap ≥ `primary_delta * 2` + 0.3 °C (default ≈ 3.3 °C / 6 °F) | **both** |
| outdoor above 5 °C (with 0.3 °C hysteresis) | **AC only** |
| outdoor below 5 °C | **boiler / TRV only** |
| no outdoor reading, small gap | **AC only** |
| AC outdoor < −15 °C | AC heating stripped from the plan (hardware protection) |

Defaults (`const.py`): `primary_delta` 1.5 °C, outdoor switchover 5 °C, AC min outdoor −15 °C, secondary power scale 0.7 when both run.

Cooling already matches 1:1 summer: orchestrator returns `None`; `async_apply` cools ACs and sends thermostats `off`. Room `off` / force-off already turns both plants off. Window interlock already pauses the room.

The Priority slider (`Settings → Control → Priority`) only changes MPC aggressiveness. It must not pick hydronic vs air.

**Gap vs townhouses:** on a mild day the mini-split heats alone. A large gap fires both plants immediately. The houses want hydronic always first, air only after hydronic has had a real chance to catch up.

---

## 2. Approaches considered

### A. Policy enum on the existing orchestrator (recommended)

Add `heat_source_policy`: `efficiency` (default) | `hydronic_first` | `air_first`. Efficiency keeps today’s gap + outdoor picker. The other two keep the same `HeatSourcePlan` / `async_apply` / compressor-group filter, and replace only the **which sources** decision.

- Fits the “additive option, defaults unchanged” fork rule.
- Reuses apply, diagnostics, hero chip, master-demand filter.
- Timed join needs a small runtime clock in the coordinator (monotonic `primary_on_since`), not a new control loop.

### B. New `plant_stager` module

A second planner that replaces the orchestrator when staging is on. Cleaner later for dual heads and shared cool, but two planners, two apply paths, and duplicate unavailable/cool-only handling — too much for 1:1.

### C. Config-only (raise outdoor switchover)

Setting outdoor threshold very high makes the boiler “preferred,” but large-gap **both** still fires immediately, and the UI still describes efficiency. Does not implement the 30–45 min join rule.

**Choice:** A for this slice. Dual heads / shared cool can grow a stager later without throwing this work away.

---

## 3. Behavior

### 3.1 Efficiency (default)

Unchanged. Existing tests in `tests/managers/test_heat_source_orchestrator.py` remain the contract. Rooms that never set `heat_source_policy` behave as today.

### 3.2 Hydronic first (these houses)

Applies only while smart source selection is on (same gate as today). Heating demand (`delta_t > 0`):

1. **Stage 1** = all available thermostats, immediately.
2. **Stage 2** = heat-capable ACs, only when **all** of:
   - stage 1 has been continuously selected for `heat_source_join_hold_minutes` (default **30**)
   - room is still at least `heat_source_join_delta` below the heat target (default **1.1 °C**, ≈ 2 °F)
   - AC heating is not stripped by `heat_source_ac_min_outdoor`
3. **Drop stage 2** when `delta_t` falls to `join_delta - drop_hysteresis` (default hysteresis **0.3 °C**, ≈ 0.5 °F), or when demand ends (`delta_t <= 0`).
4. Do **not** use outdoor prefer-AC, and do **not** use large-gap “both.”
5. If every thermostat is unavailable / missing, ACs may heat immediately (fallback). If ACs cannot heat, thermostats-only.

A gap that is already 2 °F at the start of a call **still waits** the hold time. The rule is “still short **after** the current plant has run,” not “join now if the gap is large.”

Clocks reset when stage 1 turns off, the room leaves heating, orchestration is disabled, or the room is removed. They do not reset across coordinator cycles while stage 1 stays selected.

### 3.3 Air first

Same machine with roles swapped: ACs are stage 1, thermostats are stage 2. Same join/drop numbers. `heat_source_ac_min_outdoor` still disables AC heating; if that leaves no stage 1, fall back to thermostats immediately.

This is **heating plant order only**. House A basement “prefer cool / radiant mostly off” is a later slice.

### 3.4 Cooling, off, Direct, Priority

- Cooling: no orchestrator change. 1:1 = air cools, hydronic off.
- `off` / schedule-off / away-off: both plants off (existing).
- Direct setpoint and Managed+Direct: unchanged; room sensor remains required for orchestration (already).
- Priority slider: unchanged; must not be read by the orchestrator.

---

## 4. Config and persistence

Room fields (store defaults; websocket optional). Internals stay **°C**, matching existing heat-source fields.

| Field | Default | Range | Meaning |
| --- | --- | --- | --- |
| `heat_source_policy` | `"efficiency"` | `efficiency` \| `hydronic_first` \| `air_first` | Plant-order policy |
| `heat_source_join_delta` | `1.1` | 0.5–3.0 °C | Stage 2 may join at/above this shortfall |
| `heat_source_join_hold_minutes` | `30` | 15–90 | Stage 1 must stay selected this long |
| `heat_source_drop_hysteresis` | `0.3` | 0.1–1.5 °C | Stage 2 drops at `join_delta - this` |

Existing fields (`heat_source_orchestration`, `primary_delta`, `outdoor_threshold`, `ac_min_outdoor`) stay. Efficiency UI still edits the three thresholds. Hydronic/air-first UI edits join delta, hold, drop hysteresis, and keeps AC min outdoor. Outdoor switchover and boiler-activation threshold are hidden for those policies (unused).

Frontend suffixes stay `°C` like the sibling heat-source fields. Hints mention ≈ 2 °F / 30 min / 0.5 °F. HA-native °F widgets for this section are a follow-up, not this slice.

---

## 5. Internals

Keep `evaluate_heat_sources(...)` as a pure decision function. Add optional:

- `now_monotonic: float | None = None`
- `primary_on_since: float | None = None`

Read policy and join fields from `room_config`. Existing positional callers (efficiency tests) stay valid.

Coordinator today stores `_heat_source_states: dict[str, str]` of `active_sources`. Keep that dict so hero, diagnostics, live payload, and existing tests stay stable. Add a parallel `_heat_source_primary_on_since: dict[str, float]`.

On each heating orchestration cycle:

- pass previous `active_sources`, `primary_on_since`, and `time.monotonic()`
- hydronic-first stage 1 is on when `active_sources` is `primary` or `both`; air-first stage 1 is on when it is `secondary` or `both`
- if stage 1 is on: `setdefault(area_id, now)` so the clock does not restart every cycle
- if stage 1 is off, orchestration is inactive, the plan is `None`, or the room is removed: pop the clock

Hero chip, live `active_heat_sources`, diagnostics, and `room_contributes_to_group` keep using `active_sources` (`primary` / `secondary` / `both` / `none`). No rename. `primary` still means thermostats; `secondary` still means ACs.

`async_apply` does not change. Inactive commands already idle that plant.

---

## 6. UI

`rs-heat-source-section` when orchestration is on:

- Policy select: Efficiency (default) | Hydronic first | Air first
- Efficiency: existing three number fields
- Hydronic first / Air first: join delta, hold minutes, drop hysteresis, min outdoor for AC heating

Read-only tile summarizes the active policy and the numbers that apply. i18n in `en.json`, `de.json`, `fr.json`.

---

## 7. Testing

- Existing orchestrator / coordinator / integration tests stay green with default policy.
- New unit tests: hydronic-first never selects secondary-only; outdoor mild does not steal the radiator; large gap does not join before hold; join after hold + 1.1 °C short; drop on hysteresis; clocks reset on idle; AC min outdoor; thermostat unavailable → AC fallback; air-first mirror; efficiency regression with policy key omitted.
- Coordinator: persist `primary_on_since` across cycles; clear on disable / room remove / non-heating.
- Store + websocket: persist and validate new fields.
- Frontend: `npm run build`.

---

## 8. Docs and fork rules

- `docs/control-and-devices.md` — document the three policies; Priority still does not pick the plant.
- `FORK.md` — this slice is the explicit “start coding” hydronic-priority + timed-join patch; later topologies still wait.
- `docs/townhouse/AGENT_BRIEFING.md` §11 — points here; locked house decisions are unchanged.

Upstream PR is optional and additive. Default efficiency behavior must remain RoomMind’s.

---

## 9. Success for this slice

On a House B 1:1 room with smart source **on** and policy **hydronic first**:

- heat demand → radiator/TRV commanded; mini-split not heating
- still ≈ 2 °F short after 30 minutes → mini-split heat joins; radiator stays on
- gap closes within hysteresis → mini-split heat drops; radiator can remain if still below target
- cool → mini-split cools; radiator off
- room off → both off
- a room left on Efficiency still prefers the heat pump when mild and still runs both on a large gap
