# House A/B/C climate design (RoomMind fork)

**Status:** design freeze. No plant, zone, source-policy, or equipment-graph code until a live trial of stock or identical-fork RoomMind produces a specific patch request.

**Product:** this is a parallel fork of [snazzybean/roommind](https://github.com/snazzybean/roommind). It is not a new thermostat and not a Versatile Thermostat (VTherm) fork. RoomMind’s panel is the shell. Defaults stay RoomMind’s. We merge their `main` into this fork. Optional features and bugfixes may be offered upstream; they may take them.

**Operating notes:** [FORK.md](../../../FORK.md).

---

## 1. Intent

RoomMind already does the right *kind* of job: rooms in a Home Assistant sidebar, schedules, presence, MPC, TRVs and climate devices. This house needs that product, plus a small number of topology and plant policies RoomMind does not have yet.

The fork exists so those policies can be developed without blocking RoomMind, and without replacing RoomMind.

What we will **not** do:

- Write a new climate integration or thermostat entity as the brain.
- Fork or vendor VTherm and grow a second UI.
- Change RoomMind’s default plant picker so a stock RoomMind user gets hydronic-first behavior.
- Implement Phase 1+ from this document before the house has been run on stock/fork RoomMind.

What we **will** do during the freeze:

- Keep this fork’s `main` identical to upstream except for this design and later, requested patches.
- Merge `snazzybean/roommind` `main` whenever it moves.
- Fix bugs the user reports from the live trial, on the fork, and offer generic ones upstream.

---

## 2. Three houses (design archetypes)

These are capability tiers, not three products. Stock RoomMind is House A. The live house is expected to start as A and expose B (then C) gaps during the trial.

### House A — RoomMind-native

One Home Assistant area is one RoomMind room. Devices are `climate.*` TRVs and/or ACs. One external temperature sensor (optional). RoomMind’s schedules, presence, MPC, and (if both TRV and AC exist) smart source selection are acceptable.

**Trial target:** run this with stock RoomMind (or this fork while it is still identical to stock). Report what works and what fights the house.

### House B — Dual plant, hydronic first

Same 1:1 area-to-room mapping as House A. The room has hydronic heat (TRV / floor loop climate entities) **and** a heat pump / air climate entity.

RoomMind’s smart source selection is an **efficiency/comfort plant picker**: above an outdoor threshold (default 5 °C) it prefers the AC/heat pump; below that it prefers the boiler/TRV; a large indoor gap uses both. The user does **not** want that picker. Heating priority is **hydronic first**, not heat-pump-for-efficiency.

This is **Phase 1**, and only after the live trial.

### House C — Zone ≠ room ≠ loop

The first floor is **one thermal zone**: several hydronic heat loops, sensors averaged, **one unzoned air** plant (no per-room dampers). HA areas may still exist for the UI, but they are not independent control loops.

Needs, later:

- Zones (control object above or beside rooms).
- More plant types: `switch`, cool-only at device level, Crestron floor setpoint vs a fake room setpoint used to chase floor temperature.
- A house equipment graph (plants → loops/ducts → zones → rooms/sensors).

RoomMind rooms remain the visible shell. The graph is the hidden plant model.

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

`custom_components/roommind/managers/heat_source_orchestrator.py`:

- Only runs in heating, and only if the room has at least one TRV, one AC, an external sensor, and `heat_source_orchestration` enabled.
- Comments say TRVs are primary and ACs secondary. The live policy then **prefers the AC** when outdoor temperature is above `heat_source_outdoor_threshold` (default 5 °C), with hysteresis.
- Large indoor gap → both. Below the boiler-activation threshold with no outdoor data → AC only.
- UI copy (`heat_source.toggle_hint`, `heat_source.outdoor_threshold_hint`) describes this as routing to the most efficient device.

That outdoor/efficiency switch is what House B rejects. The rest of RoomMind (MPC, schedules, panel) stays.

### 3.3 Gaps versus House C

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

**Use slowly.** Configure rooms the RoomMind way (areas, devices, sensors, schedules). Leave smart source selection as RoomMind ships it unless it is unsafe; if it is turned on, note every time it picks the heat pump for heating.

**Report back** (bugs, gaps, surprises). Useful observations, not a form:

1. How Crestron / hydronic entities appear in HA (`climate`, `switch`, floor vs room temperature, setpoint domain).
2. Whether RoomMind classifies them as Thermostat or Climate Device, and whether that is wrong.
3. Whether smart source selection ever heats with the heat pump when hydronic should have stayed on.
4. Whether one sensor per area is enough, or the first floor already feels like one zone with several loops.
5. Any command RoomMind sends that Crestron / the air plant mishandles (wrong SP, heat vs cool, off vs low).
6. Crashes, UI issues, learning/MPC stalls — generic bugs to fix on the fork and consider for upstream.

**We will implement** only:

- Upstream merges.
- Bugfixes and tiny gaps the user names as a patch.
- Nothing from Phase 1 or later until they ask.

---

## 5. Phase 1 — Hydronic-first source priority (after trial)

Optional fork behavior. **Default remains RoomMind smart source selection.**

### 5.1 Policy

Leaving Heat Source Orchestration **off** is not hydronic-first: stock RoomMind then sends heating to both TRVs and ACs. Hydronic-first is a policy **on** the existing orchestrator.

When `heat_source_orchestration` is on and `heat_source_policy` is `hydronic_first`:

1. **Heating source = hydronic** (TRVs / floor climate entities) whenever at least one hydronic device is available.
2. **Do not** prefer the heat pump because outdoor temperature is mild or COP looks better. Ignore `heat_source_outdoor_threshold` for plant choice.
3. **Cooling** still uses the air/heat-pump climate device. This policy is heating-only.
4. **Fallback:** if every hydronic heating device is unavailable/unknown, use heat-pump heat if that device can heat.
5. **Large indoor gap:** default hydronic-only. Do not auto-enable “both” for efficiency or speed unless a later trial note asks for hydronic-plus-assist. (Stock RoomMind’s “both” stays in the RoomMind policy.)
6. Hardware protection (`heat_source_ac_min_outdoor`) still applies **if** heat-pump heat is used as fallback.

The user does not want RoomMind’s efficiency/comfort plant picker for this house. The picker remains the **product default** so the fork does not fork the meaning of RoomMind.

### 5.2 Shape in the existing code (when unfrozen)

Do not add a second orchestrator. Extend `evaluate_heat_sources` with room field `heat_source_policy`:

- `efficiency` — current RoomMind behavior (default, including when the field is absent).
- `hydronic_first` — the rules in 5.1.

UI: a control on the existing Heat Source Orchestration section, visible only when that section already appears (TRV + AC + external sensor). Copy must say hydronic stays on for heating; it must not relabel the RoomMind default as “wrong.”

Offer this upstream only if RoomMind wants an optional policy. If they do not, it stays a fork option with default `efficiency`.

### 5.3 Out of scope for Phase 1

- Zones, averaged sensors, equipment graph.
- New device types (`switch`, floor-setpoint adapter, device-level cool-only).
- Changing MPC, EKF, or schedule priority.
- Turning hydronic-first on by default.

---

## 6. Later — House C (not scheduled)

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
Source policy (RoomMind efficiency default | optional hydronic_first)
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

- Existing `tests/managers/test_heat_source_orchestrator.py` and `tests/control/test_heat_source_plan.py` stay green on the default policy.
- New cases for `hydronic_first`: mild outdoor → hydronic active, AC heat inactive; hydronic unavailable → AC heat fallback; cooling mode → orchestrator still returns `None`; large gap → hydronic-only unless assist is later specified.

House C work gets its own tests when specified. Do not pre-build graph fixtures now.

---

## 9. Error handling (Phase 1)

- Missing policy field → `efficiency` (RoomMind).
- Hydronic-first enabled but room has no TRV → behave as today (orchestrator returns `None` without both types).
- All hydronic unavailable → heat-pump heat if allowed; if not, plan is `none` and RoomMind’s usual unavailable-device behavior applies.
- Do not invent a second outdoor-threshold picker for “emergencies.” Fallback is availability, not COP.

---

## 10. Success criteria

**Phase 0 is done when** the user has run stock/fork RoomMind on the house and reported concrete bugs or gaps (including “smart source heated with the heat pump” or “we need zones before source policy”).

**Phase 1 is done when** (after they ask): hydronic-first is opt-in, RoomMind default unchanged, tests prove mild weather does not steal heat from hydronic, and the panel still looks like RoomMind.

**House C is not success-gated yet.** It is a backlog so later work does not restart a new thermostat.

---

## 11. Implementation gate

Do **not** open a feature branch for Phase 1 or House C because this spec exists.

Unfreeze only if:

- the user asks for a named patch, or
- the trial report says Phase 1 (or a smaller bugfix) is required.

Until then, the only code changes on this fork should be upstream merges and requested fixes.
