# Townhouse hybrid climate — full picture for agents

**This file is the product spec.** Put a copy in [Vovixxx/roommind](https://github.com/Vovixxx/roommind) at `docs/townhouse/AGENT_BRIEFING.md` so every agent started **on that repo** can see it.

Do not try to fetch the design Cloud Agent. That run has **no GitHub repository**, so Cursor `batch-fetch-details` / “access this agent id” **cannot work** from the fork.

| | |
| --- | --- |
| Design conversation (no repo, cannot be fetched from the fork) | [`bc-01a09cfa-aa72-76ba-9941-df75d39a564f`](https://cursor.com/agents/bc-01a09cfa-aa72-76ba-9941-df75d39a564f) |
| Code lives here | [Vovixxx/roommind](https://github.com/Vovixxx/roommind) |
| Upstream | [snazzybean/roommind](https://github.com/snazzybean/roommind) `main` @ `9094a71` (≈ v1.7.6) |
| User / fork owner | Vladimir Vasiljev (`Vovixxx`) |

Older notes in `docs/superpowers/specs/2026-09-13-hybrid-climate-and-window-advice-design.md` still describe a Versatile Thermostat (`over_staged`) fork in §3 and §8–§16. **That path is abandoned.** §1, §17, and §18 plus **this file** are current.

---

## 1. What we are building

NYC townhouses with mixed **hydronic heat** (radiant floors / radiators) and **mini-splits / Carrier**. Many physical `climate.*` entities (House A ~12, B ~12, C ~10). Today that often means a Versatile Thermostat wrapper on each plant as well — too many user-facing thermostats, still no staging.

**Destination:** one user-facing **zone** (RoomMind “room” / Home Assistant area), not 10–26 stacked climates.

```
you → one RoomMind zone climate → Crestron / Mitsubishi / Nest / Carrier (via HA)
```

**Aim** each plant’s own logic (setpoint / mode / on-off). **Do not** replace Mitsubishi, Crestron, Nest, or Carrier control loops. No air dampers. Extra radiant loops on an open floor keep the **slab even** (hallway vs kitchen). They are not extra ACs.

Talk to equipment **only through Home Assistant:** `climate.set_hvac_mode` / `set_temperature` or `switch.turn_on` / `turn_off`. Detect modes from the entity. Config supplies role (heat vs air, first vs second head, Crestron floor vs room).

---

## 2. Locked decisions (do not reopen)

### Do

- Extend **RoomMind**. Fork is `Vovixxx/roommind`. `upstream` = `snazzybean/roommind`.
- Parallel development: **always merge their `main`**. Offer optional/additive PRs; they may merge. If they don’t, it stays on the fork.
- Defaults stay RoomMind’s. Do not break stock RoomMind for other users.
- Bugfixes land on the fork immediately.
- **Managed + Direct** on Mitsubishi / Crestron / Nest (let the unit think). Full Control + MPC is more aggressive than wanted. Proportional boost is **opt-in**.
- Plant order: **hydronic / radiator first**, mini-split **second** only if hydronic cannot keep up. Not “heat pump is more efficient.”
- Join rule (desired, not in RoomMind today): next plant joins if the room is still ~**2°F** on the wrong side of setpoint after the current plant has run ~**30–45 min**. Drop with hysteresis ~0.5–1°F. Configurable.
- Closed bedrooms + one unzoned AC: per-room **heat**; cool is whole-floor; **any room wants cool → unit cools** at the **lowest** requesting cool setpoint. Never send `heat` to cool-only (Carrier).
- Dual heads (House B living): first head, then second if still short.
- House A basement exception: **prefer cool**; radiant mostly off (boiler already overheats the room).
- Keep Versatile Thermostat on **unmigrated** plants. Remove per-plant VTherm when a zone moves to RoomMind.
- °F defaults. HA-native conversion if the instance is metric.
- Leave each Crestron in whatever floor-or-room mode it already uses. Do not flip that mode.

### Do not

- Fork Versatile Thermostat.
- Build a three-layer stack (hybrid → VTherm → physical).
- Build window / dew-point **advice** (dropped). Window **interlock** (pause when a window is open) is fine — RoomMind already has it.
- Efficiency-first heat-pump priority. RoomMind’s **smart source selection** (gap + outdoor, prefer HP when mild) is the **wrong policy** for these houses.
- Let RoomMind’s comfort-vs-efficiency **Priority** slider choose the plant. That slider only changes how hard MPC works; it must not pick hydronic vs air.
- Invent air zoning / dampers.
- Replace Nest learning with a second learner. Command Nest as a dumb actuator (mode + setpoint + off).
- Slam mini-split fan speeds. Leave fan **auto**. Nudge setpoint so *its* return-air loop keeps working when room ≠ return.
- Implement Nest / Mitsubishi / Crestron / Carrier **protocols**. HA already did.
- Start a from-scratch thermostat.
- Duplicate upstream PRs: [#425](https://github.com/snazzybean/roommind/pull/425) wall climate as comfort setpoint; [#405](https://github.com/snazzybean/roommind/pull/405) idle `engaged` (inverter never-off); [#413](https://github.com/snazzybean/roommind/pull/413) direct TRV valve %.
- Base work on other people’s forks. Base **only** on `snazzybean/main`. Feature branches on origin are abandoned (behind main). ~40 forks; none is a major community fork to join.

**Priority / hydronic-first is the first code change after a live trial, not the whole product.** See §6.

---

## 3. Why RoomMind, not VTherm, not from scratch

**VTherm** is a strong **single-plant** wrapper (return vs room, auto start/stop). It does not stage radiant vs mini-split. Wrapping every plant doubles entities.

**RoomMind** already has the product shape we want:

- One **room** (HA area), several `climate.*` devices.
- **Thermostat** (radiator / TRV) vs **Climate Device** (AC / mini-split / heat pump).
- External room sensor → Full Control. No external sensor → **Managed** (send the target, device’s own loop).
- **Direct** setpoint = send the real target. **Proportional** = exaggerate setpoint.
- Sidebar panel UI (the shell we keep).
- Window pause, presence, schedules, vacation, compressor groups.

What RoomMind gets **wrong for these houses** (in `heat_source_orchestrator.py`): when Smart source selection is on, thermostats are “primary” and ACs “secondary” in *labels*, but the **policy** prefers the heat pump in mild weather and runs **both** when the gap is large. We want: hydronic always first; air joins on the **timed** 2°F / 30–45 min rule, not efficiency.

---

## 4. Three houses (inventories are complete)

No other HVAC components. No air dampers. No extra hydronic valves.

### House A (~12 climates)

| Area | Plants |
| --- | --- |
| Basement | Wall Mitsubishi (ESPHome) heat+cool + Crestron radiant with floor sensor. Radiant almost never; winter AC because the **boiler lives in the room**. |
| First floor | Kitchen / living / laundry Crestron (room+floor). **One open space.** One concealed ducted Mitsubishi. **No dampers.** Three loops keep the slab even. |
| Second floor | 5 Nest radiator rooms + **Carrier cool-only** in the attic. Never send `heat` to Carrier. |

### House B (~12) — trial house

| Area | Plants |
| --- | --- |
| Basement | Radiator only (heat-only). |
| Living + hallway | One radiant (**no** floor sensor) + **two** wall mini-splits. First head, then second if still short. |
| Office, guest, master, bedroom | Each **1:1** radiator + mini-split. |

**Phase-1 trial room is one of these 1:1 rooms**, not House A basement, not living dual-head.

Brands for B were not specified. Same stack: RoomMind → physical HA climates.

### House C (~10)

No basement.

| Area | Plants |
| --- | --- |
| Living + powder | Wood floor sensors, two radiant loops, **shared** ducted mini-split. Cap floor temp for hardwood later. |
| First-floor bedroom | 1:1 radiator + concealed mini-split. |
| Upstairs | 3 radiators + bathroom radiant (**no** floor sensor) + one ducted mini-split. |

---

## 5. Topology catalog (what the product must allow)

| Pattern | Example |
| --- | --- |
| 1 heat + 1 air | A basement; B office; C first-floor bedroom |
| 1 heat + 0 air | B basement |
| 0 heat + 1 air | none yet; allow it |
| N heat + 1 air (open floor, even slab) | A first floor; C living+powder |
| N heat + 1 air (closed rooms, unzoned cool) | A second floor; C second floor |
| 1 heat + N air | B living + hallway (2 heads) |
| Optional / prefer-cool heat | A basement |
| Cool-only air | A Carrier |
| Heat+cool air | Mitsubishi |
| On/off relay | zone valve / boiler demand — toggle only |

---

## 6. Beyond “one checkbox”

RoomMind **zone** = e.g. first floor with three heat loops + one air + **averaged** room sensors (HA mean helper for the trial; internal later).

More plant kinds than thermostat vs climate device:

| Kind | How we aim it |
| --- | --- |
| Heat climate, room setpoint | Nest, many stats: `heat`/`off` + room number |
| Heat climate, **floor** setpoint | Crestron in floor mode: compute floor SP from room + outdoor, send **floor** number |
| Heat climate, room SP only, but we care about floor | Offset the room SP so *its* loop chases a floor sensor |
| On/off | Relay / zone valve: toggle only; zone holds the number |
| Heat+cool air | Mitsubishi: mode + setpoint; return vs room |
| Cool-only air | Carrier: `cool`/`off`, never `heat` |
| Shared plant | One boiler, 2–3 heat pumps, one condenser — house graph, not a per-room duplicate |

RoomMind’s sidebar is the shell. Forecast may later change *equipment* behavior (e.g. don’t load the slab before a warm-up). That is not the dropped window-advice product.

---

## 7. How we talk to plants

We **read** `hvac_modes`, `supported_features`, `current_temperature`, `hvac_action`, optional extra sensors (room, floor, return).

| Detect from the entity | Ask in config |
| --- | --- |
| Can heat / can cool / off-only | Role: stage-1 heat, stage-2 air, cool-only, optional heat, first vs second head |
| Has target temperature or on/off only | Setpoint meaning: room vs floor (Crestron) |
| `current_temperature` (often Mitsubishi **return**) | Which sensor is **room** comfort |
| `hvac_action` | Floor sensor entity (if any) |
| Fan modes exist | Leave fan on auto |

Mini-split note: return can read 76 while the room is 78. Commanding 76 idles the head. Managed+Direct still needs a **room** sensor for staging decisions; Full Control / proportional boost is opt-in, not the default for Mitsubishi.

---

## 8. Staging (desired policy)

Default winter (1:1, and open floor with one air plant):

1. **Stage 1 heat** = hydronic. On an open floor, all loops get the same comfort setpoint and run locally.
2. **Stage 2 heat** = air heat, only when stage 1 cannot keep up (2°F / 30–45 min).
3. **Stage 3 heat** (House B living only) = second wall head, same join rule.

Default summer: cooling only. Heat plants off (or frost if window policy says so). House B living: first head cools; second joins if still ~2°F above cool setpoint after the wait.

House A basement: prefer mini-split. Radiant off unless the room is actually cold. Cooling allowed any season.

Shoulder / “nice out” is **not** an HVAC decision in this work.

---

## 9. Shared air vs extra radiant vs dual heads

**No HVAC zoning.** If the first-floor ducted unit runs, the whole open floor gets that air.

**Open floor + several radiant loops + 1 air:** one user climate, one air plant, several heat plants. Hallway can heat when the door opens; kitchen can sit idle. Same comfort setpoint.

**Closed rooms + 1 unzoned air:** per-room heat setpoints. If **any** room wants cool, the shared plant cools at the **lowest** of those cool setpoints. One writer to the Carrier — do not let several bedroom climates each command it.

**1 zone + N heads:** first head only, then the second. Config picks which head is first. Each head still has its own return for any self-reg.

---

## 10. What the user should do before we write a lot of code

1. HACS custom repository: `https://github.com/Vovixxx/roommind` (identical to upstream until we push patches).
2. Use RoomMind **slowly** on a House B **1:1** room:
   - Thermostat = radiator
   - Climate Device = mini-split
   - Room sensor assigned
   - **Direct** setpoint mode
   - Smart source **on** so they *feel* current HP-prefer behavior (that is the bug/gap, not the goal)
3. Optionally dump first-floor heats into one HA area to feel the “one zone” idea.
4. Report bugs and gaps. We patch the fork. PR upstream when additive.

Do **not** implement a new thermostat or a VTherm fork unless the user explicitly abandons RoomMind after the trial.

---

## 11. Implementation order (after trial)

| Order | Work | Notes |
| --- | --- | --- |
| 0 | User trial + gap list | No large code until they have lived with stock RoomMind |
| 1 | Optional **source priority**: hydronic first \| air first \| (their) efficiency | Defaults stay RoomMind’s efficiency policy for other users. These houses: hydronic first. Comfort/efficiency slider must not pick the plant. |
| 2 | Bugfixes found in trial | Fork immediately; upstream PR if clean |
| later | Timed join (2°F / 30–45 min) | Replaces “both when gap is large” for these houses |
| later | Dual heads first-then-second | House B living |
| later | Prefer-cool / optional radiant | House A basement |
| later | Zone averaging of several room sensors | HA mean helper is enough for trial |
| later | Extra plant types: `switch`, cool-only lock, Crestron floor SP, room-SP-chasing-floor | |
| later | Closed-room shared cool-only writer | Carrier |
| later | Weather-compensated floor target + **max floor °F** (hardwood) | House C |

1:1 hydronic-first + timed join (items 1 + timed join) is specified in [docs/superpowers/specs/2026-09-14-staging-feature-design.md](../superpowers/specs/2026-09-14-staging-feature-design.md) with implementation steps in [docs/superpowers/plans/2026-09-14-staging-feature.md](../superpowers/plans/2026-09-14-staging-feature.md). Dual heads, prefer-cool, and shared cool stay later.

---

## 12. Success (so we know we are done with a phase)

**Trial (stock RoomMind, House B 1:1):** user can heat/cool one room from the RoomMind panel; we have a written gap list.

**Priority patch:** with hydronic-first selected, radiator runs before mini-split heat; stock default unchanged for rooms that keep efficiency mode.

**Later 1:1 with timed join:** one user climate; cool = air on, heat plant off; heat = hydronic first, air heat only if still ~2°F short after ~30–45 min; `off` turns both physical plants off.

**Open floor:** one first-floor climate drives several radiant plants (hallway can run, kitchen idle) and one unzoned air plant from a single setpoint.

**Dual head:** living+hallway runs one wall head first; second only if still ~2°F short.

**Upstairs Carrier:** rooms have their own heat setpoints; Carrier cools when any room wants cool; air setpoint is the lowest cool request; never `heat`.

---

## 13. Risks

- Entity pile-up if we leave stock VTherm on every plant *and* add RoomMind.
- Fighting controllers: RoomMind must be the only thing that sets a migrated plant.
- Nest still learns — treat as dumb actuator; trial avoids upstairs.
- Kitchen vs hallway cannot be cooled separately.
- Several bedroom climates must not each write the Carrier.
- Two Mitsubishis get different command setpoints (different returns). That is OK.
- Floor math without a max-temp clamp can damage House C hardwood.
- House A basement is a bad first demo.
- If a Crestron is in floor-setpoint mode, sending 72 (room) as a floor target will cook or starve the slab.

---

## 14. Instructions for the agent on `Vovixxx/roommind`

You are in the **repo**. This file is the spec. You cannot and need not load `bc-01a09cfa-aa72-76ba-9941-df75d39a564f`.

1. Keep this document updated when the user changes a decision.
2. Merge `upstream/main` into the fork regularly.
3. Additive options; RoomMind defaults unchanged.
4. Do not implement VTherm, a from-scratch thermostat, or window-advice.
5. Do not implement a large hydronic-priority patch until the user has tried stock RoomMind **unless they explicitly ask you to start coding**.
6. Watch upstream PRs #425, #405, #413 — do not duplicate them.
7. HACS install URL for the house: `https://github.com/Vovixxx/roommind`.
