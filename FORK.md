# This fork

This repository is a **parallel fork** of [snazzybean/roommind](https://github.com/snazzybean/roommind).

It is **not** a new thermostat, and it is **not** a Versatile Thermostat (VTherm) fork. RoomMind remains the product: its UI is the shell, and its `main` is merged here on an ongoing basis.

**Product spec:** [docs/townhouse/AGENT_BRIEFING.md](docs/townhouse/AGENT_BRIEFING.md). That file is the source of truth. Do not fetch design Cloud Agent [`bc-01a09cfa-aa72-76ba-9941-df75d39a564f`](https://cursor.com/agents/bc-01a09cfa-aa72-76ba-9941-df75d39a564f) from this repo — that run has no GitHub repository.

**Hydronic-first + timed join for 1:1** is the approved first code slice; dual heads, prefer-cool, shared cool, and other topologies still wait for later work.

## Operating model

| Rule | Meaning |
| --- | --- |
| Merge theirs | Always merge `snazzybean/roommind` `main` into this fork’s `main`. |
| Defaults stay RoomMind’s | Do not break stock RoomMind for other users. Optional features stay additive. |
| These houses ≠ the picker | Hydronic first, air second if hydronic cannot keep up. RoomMind’s smart source selection (prefer HP when mild) is the wrong policy here. The Priority slider must not pick the plant. |
| Upstream PRs are optional | Generic bugfixes and additive features may be offered to RoomMind. They may take them or not. |
| Fix on the fork | Trial bugs and house-specific gaps are fixed here first. |
| RoomMind UI is the shell | One user-facing zone climate per area, not a new thermostat UI. |
| Trial first | House B 1:1 room, Direct setpoint, smart source on to *feel* current HP-prefer behavior. |

## HACS

This fork is not in the HACS default store. Add `https://github.com/Vovixxx/roommind` as a custom **integration** repository.

`hacs.json` uses `zip_release`, so HACS only installs from a GitHub **Release** asset named `roommind.zip` (not from a commit). Pushing to `main` publishes that asset via `.github/workflows/release.yml`. After the first release exists, refresh HACS and download the version — do not install the default branch.

## Sync upstream

```bash
git remote add upstream https://github.com/snazzybean/roommind.git   # once
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

Resolve conflicts in favor of keeping RoomMind defaults and behavior unless a documented fork option already exists and tests cover it.

Do not duplicate upstream PRs [#425](https://github.com/snazzybean/roommind/pull/425), [#405](https://github.com/snazzybean/roommind/pull/405), or [#413](https://github.com/snazzybean/roommind/pull/413). Base only on `snazzybean/main`.

## What this fork will not do

- Fork Versatile Thermostat or build a hybrid → VTherm → physical stack.
- Start a from-scratch thermostat.
- Build window / dew-point advice (window *interlock* already exists).
- Change RoomMind’s default smart source selection for everyone.
- Extra plant types, dual heads, or an equipment graph (unless the user explicitly asks).

Hydronic-first + timed join for 1:1 is implemented; it is not deferred until the live trial.

## What this fork adds

Upstream RoomMind is unchanged when the new options are left at their defaults. Efficiency staging, proportional and direct setpoints, valve control, the compressor min-run, and the MPC optimizer are the upstream code. The fork adds:

| Piece | What it does | What it does not change |
| --- | --- | --- |
| Hydronic first / air first | The plant runs first. The backup joins only after the wait and only while the room is still short. | Efficiency, the default, still uses the outdoor crossover and the gap. |
| Staging knobs | Hysteresis, backup-gap multiplier, and backup power scale were hardcoded. They are now room settings, with the old numbers as defaults. | At those defaults the efficiency decision matches upstream. |
| Follow | Shifts the room error into the device's own sensor, then adds the same setpoint offset Direct uses. | Proportional devices ignore the offset. |
| One zone device | The room climate and its helpers share one Home Assistant device. The old override climate is no longer created. Holds stay on the zone climate. | |
| Heat switch | `switch` can be an electric heater, radiant floor, radiator, or boiler. It is turned on and off. It is not sent climate services. | A room with no switch never calls `switch.turn_on`. |
| Boiler profile | A boiler switch holds on for 10 minutes. A heat-pump backup uses the 15 minute profile instead of the floor's 30. | The compressor group is still the shared outdoor-unit lock. It is not replaced by the boiler profile. |
| Unit | The zone climate, target sensor, heat-source card, and cover thresholds follow Celsius or Fahrenheit. Storage stays Celsius. | |

Heating behaviour is set on each device. The old room-wide "Heating system type" control wrote the same field onto every thermostat, so it is gone. A stored primary or backup role is ignored. The orchestrator is the only staging decision. A thermostat or heat switch is the plant. A climate that can heat is the backup. Cool-only still keeps a climate out of heating. Air first is the policy that runs the backup first.
