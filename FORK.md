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
- Land hydronic-first, timed join, extra plant types, or an equipment graph before the live trial asks for that patch (unless the user explicitly asks to start coding).
