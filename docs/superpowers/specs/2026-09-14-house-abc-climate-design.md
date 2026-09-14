# House climate design (RoomMind fork)

**Status:** design freeze. No plant, zone, source-policy, or equipment-graph code until a live trial of stock or identical-fork RoomMind produces a specific patch request.

**Product:** this is a parallel fork of [snazzybean/roommind](https://github.com/snazzybean/roommind). It is not a new thermostat and not a Versatile Thermostat (VTherm) fork. RoomMind’s panel is the shell. We merge their `main` into this fork. Optional features and bugfixes may be offered upstream; they may take them.

**Operating notes:** [FORK.md](../../../FORK.md).

**Source of this document:** the user’s continuation brief for this fork (not a new thermostat, not a VTherm fork, hydronic-first after trial, then zones/plants/graph). An earlier draft labeled those as House A / B / C *capability tiers* of one house that “starts as stock RoomMind.” That mapping was reconstructed, not recovered, and it is **not** the design. Do not reintroduce A/B/C as a progression (stock → hydronic-first → zones).

---

## 1. Intent

RoomMind already does the right *kind* of job: rooms in a Home Assistant sidebar, schedules, presence, MPC, TRVs and climate devices. This house needs that product, plus plant and topology policies RoomMind does not have.

The fork exists so those policies can be developed without blocking RoomMind, and without replacing RoomMind.

Two “default” rules that must not be collapsed into each other:

| Rule | Applies to | Does **not** mean |
| --- | --- | --- |
| Defaults stay RoomMind’s | Upstream relationship and unmigrated rooms. Code that might be offered upstream must not silently change stock RoomMind. | This house should keep using RoomMind’s efficiency/comfort plant picker. |
| This house does not want the plant picker | Heating on this house after the trial patch. Source priority is **hydronic first**, not heat-pump-for-efficiency. | Ship hydronic-first as RoomMind’s global default, or treat the picker as an acceptable long-term policy here. |

What we will **not** do:

- Write a new climate integration or thermostat entity as the brain.
- Fork or vendor VTherm and grow a second UI.
- Change RoomMind’s default plant picker so a stock RoomMind user gets hydronic-first.
- Treat RoomMind’s smart source selection as the desired heating policy for this house.
- Implement Phase 1+ from this document before the house has been run on stock/fork RoomMind.

What we **will** do during the freeze:

- Keep this fork’s `main` identical to upstream except for this design and later, requested patches.
- Merge `snazzybean/roommind` `main` whenever it moves.
- Fix bugs the user reports from the live trial, on the fork, and offer generic ones upstream.

---

## 2. What this house needs (in order)

Not three products. Not a ladder where the live house “starts as stock RoomMind” and graduates. One RoomMind-shelled house, with work sequenced so we do not guess topology before a trial.

1. **Now — live trial of stock RoomMind** (or this fork while it is still identical). Configure the real house. Report bugs and gaps. No hydronic-first or zone build yet.
2. **Phase 1 after trial — hydronic-first heating.** Dual-plant rooms (hydronic + heat pump / air) heat from hydronic whenever hydronic is available. The user does not want RoomMind’s efficiency/comfort plant picker. Cooling still uses the air plant.
3. **Then — topology and plants**, only after Phase 1 or a trial note that Phase 1 is pointless until topology exists:
   - First floor = **one thermal zone**, several hydronic heat loops, sensors **averaged**, **one unzoned air** plant.
   - More plant types: `switch`, cool-only at device level, Crestron floor setpoint vs a fake room setpoint used to chase floor temperature.
   - A house **equipment graph**. RoomMind UI stays the shell.

RoomMind rooms remain the visible shell throughout.

---

## 3. What stock RoomMind actually does today

Facts from this tree (`snazzybean/roommind` @ `9094a71`, also this fork’s `main`). Phase 1 must sit on these, not on a parallel controller.

### 3.1 Room and devices

- A room is a Home Assistant area with a RoomMind config.
- Devices are only `trv` or `ac` (`custom_components/roommind/utils/device_utils.py`). Both are `climate.*` entities.
- `heating_system_type` on a TRV is `radiator` or `underfloor`. That only changes residual-heat and window-delay behavior. It is **not** a plant graph and **not** a floor-setpoint adapter.
- Room `climate_mode` is `auto` / `heat_only` / `cool_only`. That is per **room**, not per device. A cooling-only minisplit in a dual-plant room is still an `ac` and can be selected for heating if `hvac_modes` include heat (or modes are unreliable).
- One `temperature_sensor` per room. There is no first-class average of several sensors.

### 3.2 Smart source selection (the plant picker)

`custom_components/roommind/managers/heat_source_orchestrator.py` (`evaluate_heat_sources`) plus the coordinator gate:

**Coordinator gate** (`coordinator.py`): orchestration is only invoked in heating when `heat_source_orchestration` is on, the room has at least one TRV and one AC, **and** `has_external_sensor` is true. If that gate fails, the non-orchestrated `async_apply` path **commands all devices**. Leaving orchestration off is therefore not hydronic-first.

**Inside `evaluate_heat_sources`:** the function itself does **not** check for an external sensor. It returns `None` unless mode is heating, orchestration is on, both device types exist, and current/target temps are present. Outdoor may be `None`.

Comments say TRVs are primary and ACs secondary. The live policy then prefers AC heat in several branches, not only the outdoor-threshold switch:

| Condition | Stock result |
| --- | --- |
| Outdoor above `heat_source_outdoor_threshold` (default 5 °C, with hysteresis) | AC (`secondary`) |
| Indoor gap ≥ `primary_delta * HEAT_SOURCE_LARGE_GAP_MULTIPLIER` (and hysteresis holding `both`) | **both** plants |
| No outdoor data and gap below the boiler-activation heuristic | AC (`secondary`) |
| Outdoor below threshold (with hysteresis) and gap not “large” | hydronic (`primary`) |
| Chosen group empty / AC too cold (`heat_source_ac_min_outdoor`) | fall back to the other group |

UI copy (`heat_source.toggle_hint`, `heat_source.outdoor_threshold_hint`) describes this as routing to the most efficient device.

Phase 1 rejects **all** of those AC-preference and “both” branches for heating, not merely the 5 °C outdoor switch. The rest of RoomMind (MPC, schedules, panel) stays.

### 3.3 Gaps versus later topology / plants

| Need | Stock RoomMind |
| --- | --- |
| Several loops as one zone | Each area is its own room; each TRV is commanded from that room |
| Average several sensors | Single `temperature_sensor` |
| Unzoned air (one air plant, many rooms) | AC is a per-room device; compressor groups exist but are not a shared air zone |
| `switch.*` plant | Devices must be `climate.*` |
| Device-level cool-only | Only room `climate_mode` |
| Crestron floor SP vs fake room SP | Proportional/direct setpoint on a TRV; no floor-probe chase, no separate floor entity |
| House equipment graph | None; each room owns its device list |

---

## 4. Phase 0 — Live trial (now)

**Goal:** run RoomMind on the real house and write down what it does, not what we imagine it will do.

**Install:** stock RoomMind from HACS, or this fork while `main` matches upstream. Do not install a hydronic-first or zone build yet.

**Use slowly.** Configure rooms the RoomMind way (areas, devices, sensors, schedules). The trial is observational. Stock smart source selection is **not** the desired end state; turn it on only if it is the safest way to see what it does, or leave it off if running both plants would be unsafe. If it is on, note every time it picks the heat pump for heating.

**Report back** (bugs, gaps, surprises). Useful observations, not a form:

1. How Crestron / hydronic entities appear in HA (`climate`, `switch`, floor vs room temperature, setpoint domain).
2. Whether RoomMind classifies them as Thermostat or Climate Device, and whether that is wrong.
3. Whether smart source selection ever heats with the heat pump when hydronic should have stayed on — including mild outdoor, missing outdoor data, and large indoor gap (stock uses both plants).
4. Whether one sensor per area is enough, or the first floor already feels like one zone with several loops. If the trial says zones are required before source policy, Phase 1 waits.
5. Any command RoomMind sends that Crestron / the air plant mishandles (wrong SP, heat vs cool, off vs low).
6. Crashes, UI issues, learning/MPC stalls — generic bugs to fix on the fork and consider for upstream.

**We will implement** only:

- Upstream merges.
- Bugfixes and tiny gaps the user names as a patch.
- Nothing from Phase 1 or later until they ask.

---

## 5. Phase 1 — Hydronic-first source priority (after trial)

This house’s heating policy once they ask for the patch. It is **not** RoomMind’s product default, and it is **not** “optional in the sense that this house might keep the picker.”

When implementing: keep the data-model default as current RoomMind behavior so unmigrated rooms and any upstream PR stay stock. Enable hydronic-first on this house’s dual-plant rooms as part of the requested patch (not a buried toggle the house is expected to discover).

### 5.1 Policy

Leaving Heat Source Orchestration **off** is not hydronic-first: stock RoomMind then sends heating to both TRVs and ACs. Hydronic-first is a policy **on** the existing orchestrator.

When `heat_source_orchestration` is on and `heat_source_policy` is `hydronic_first`:

1. **Heating source = hydronic** (TRVs / floor climate entities) whenever at least one hydronic device is available.
2. **Do not** prefer the heat pump because outdoor temperature is mild, COP looks better, outdoor data is missing, or the indoor gap is small. Ignore `heat_source_outdoor_threshold` and the no-outdoor delta-T heuristic for plant choice.
3. **Cooling** still uses the air/heat-pump climate device. This policy is heating-only.
4. **Fallback:** if every hydronic heating device is unavailable/unknown, use heat-pump heat if that device can heat.
5. **Large indoor gap:** hydronic-only. Do not auto-enable “both” for efficiency or speed, and do not keep a previous `both` / `secondary` hysteresis state. (Stock RoomMind’s “both” stays only in the RoomMind `efficiency` policy.)
6. Hardware protection (`heat_source_ac_min_outdoor`) still applies **if** heat-pump heat is used as fallback.

### 5.2 Shape in the existing code (when unfrozen)

Do not add a second orchestrator. Extend `evaluate_heat_sources` with room field `heat_source_policy`:

- `efficiency` — current RoomMind behavior (data-model default, including when the field is absent).
- `hydronic_first` — the rules in 5.1. Must short-circuit **every** AC-preference and `both` branch listed in §3.2, not only the outdoor-threshold comparison.

UI: a control on the existing Heat Source Orchestration section, visible only when that section already appears (coordinator already requires TRV + AC + external sensor). Copy must say hydronic stays on for heating. Do not relabel the RoomMind default as “wrong” for stock users; do not imply this house should leave the picker selected.

Offer this upstream only if RoomMind wants an optional policy. If they do not, it stays a fork option whose data-model default is `efficiency`.

### 5.3 Out of scope for Phase 1

- Zones, averaged sensors, equipment graph.
- New device types (`switch`, floor-setpoint adapter, device-level cool-only).
- Changing MPC, EKF, or schedule priority.
- Changing RoomMind’s global/default picker for everyone.

---

## 6. Later — topology and plants (not scheduled)

Work these only after Phase 1 (or a trial note that Phase 1 is pointless until topology exists). Each is its own spec + plan when unfrozen.

### 6.1 Zones

- **First floor = one zone.** Several hydronic loops are actuators of that zone, not independent RoomMind rooms with competing MPCs.
- Zone air temperature = **average** of the assigned sensors (equal weight unless a later spec says otherwise).
- **One unzoned air** plant: a single air/heat-pump (or AHU) serving the zone/house without per-room airflow control. RoomMind compressor groups are not this; they only protect a shared outdoor unit.
- HA areas / RoomMind room cards can remain for names, occupancy, windows, and overrides. Control of shared loops and the air plant happens at the zone.

### 6.2 More plant types

Still commanded from RoomMind, still shown in the room/zone device list:

| Plant | Role |
| --- | --- |
| `switch` | On/off boiler, pump, or valve. No setpoint. Demand is boolean. |
| Cool-only device | `ac` that must never be selected for heating, even if `hvac_modes` look like they include heat or are unreliable. Distinct from room `climate_mode: cool_only`. |
| Crestron floor SP | Write the real floor-setpoint entity when HA exposes it. |
| Fake room SP to chase floor | If Crestron only accepts a room setpoint but the process variable is floor temperature, RoomMind holds a synthetic room SP so the floor probe tracks the desired floor temperature. Direct room-temp control of that plant is wrong. |

Proportional vs direct setpoint stays RoomMind’s TRV language. Floor chase is a **plant adapter**, not a new MPC.

### 6.3 House equipment graph

A house-level model, not a second UI:

- **Plants** — boiler / hydronic source, heat pump, air handler, cool-only heads.
- **Edges** — hydronic loops, unzoned air.
- **Zones** — thermal control units (first floor is one).
- **Rooms** — RoomMind shell (areas, sensors, occupancy, windows).
- **Sensors** — room, floor, outdoor; averaging is a zone property.

Rooms do not each own a private copy of the boiler or the air plant. Shared plants receive the union of zone demand, with hydronic-first as the heating policy when both hydronic and heat-pump heat could run.

---

## 7. Architecture (when anything is built)

```
RoomMind panel (unchanged shell)
        │
        ▼
Room configs, schedules, presence, vacation, MPC per control unit
        │
        ▼
Source policy (RoomMind efficiency default in the data model |
              hydronic_first for this house after the Phase 1 patch)
        │
        ▼
Plant adapters (climate TRV/AC today; later switch, floor SP, floor-chase)
        │
        ▼
Home Assistant entities
```

Later, “per control unit” may mean **zone** rather than **room** for shared loops and unzoned air. The panel still looks like RoomMind rooms.

Isolation:

- Source policy is a filter on the existing heat-source plan. It must not fork `async_apply` or the thermal model.
- Plant adapters translate a plan into entity services. New types get adapters; TRV/AC keep current apply paths.
- The equipment graph is data + demand aggregation. It must not become a separate frontend.

---

## 8. Testing (when unfrozen)

Phase 1:

- Existing `tests/managers/test_heat_source_orchestrator.py` and `tests/control/test_heat_source_plan.py` stay green on the default (`efficiency`) policy.
- New cases for `hydronic_first`:
  - mild outdoor → hydronic active, AC heat inactive
  - no outdoor data, small indoor gap → hydronic active (stock would pick AC)
  - large gap → hydronic-only, not `both`
  - previous state `secondary` or `both` does not keep AC on
  - hydronic unavailable → AC heat fallback
  - cooling mode → orchestrator still returns `None`

Later topology/plant work gets its own tests when specified. Do not pre-build graph fixtures now.

---

## 9. Error handling (Phase 1)

- Missing policy field → `efficiency` (RoomMind).
- Hydronic-first enabled but room has no TRV → behave as today (orchestrator returns `None` without both types).
- All hydronic unavailable → heat-pump heat if allowed; if not, plan is `none` and RoomMind’s usual unavailable-device behavior applies.
- Do not invent a second outdoor-threshold picker for “emergencies.” Fallback is availability, not COP.

---

## 10. Success criteria

**Phase 0 is done when** the user has run stock/fork RoomMind on the house and reported concrete bugs or gaps (including “smart source heated with the heat pump” or “we need zones before source policy”).

**Phase 1 is done when** (after they ask): this house’s dual-plant rooms heat hydronic-first, RoomMind’s data-model default is unchanged, tests prove mild weather / missing outdoor / large gap do not steal heat from hydronic, and the panel still looks like RoomMind.

**Topology and extra plants are not success-gated yet.** They are a backlog so later work does not restart a new thermostat.

---

## 11. Implementation gate

Do **not** open a feature branch for Phase 1 or later topology because this spec exists.

Unfreeze only if:

- the user asks for a named patch, or
- the trial report says Phase 1 (or a smaller bugfix) is required.

Until then, the only code changes on this fork should be upstream merges and requested fixes.
