# This fork

This repository is a **parallel fork** of [snazzybean/roommind](https://github.com/snazzybean/roommind).

It is **not** a new thermostat, and it is **not** a Versatile Thermostat (VTherm) fork. RoomMind remains the product: its UI is the shell, its defaults stay RoomMind’s, and its `main` is merged here on an ongoing basis.

House climate work for this fork (House A / B / C, hydronic-first source priority, later zones and plant adapters) is specified in [docs/superpowers/specs/2026-09-14-house-abc-climate-design.md](docs/superpowers/specs/2026-09-14-house-abc-climate-design.md). That spec is the source of truth. **Do not implement plant, zone, or source-policy features until a live trial of stock/fork RoomMind has produced a specific patch request.**

## Operating model

| Rule | Meaning |
| --- | --- |
| Merge theirs | Always merge `snazzybean/roommind` `main` into this fork’s `main`. |
| Defaults stay RoomMind’s | Optional fork features are off (or match upstream) unless the user turns them on. |
| Upstream PRs are optional | Generic bugfixes and features may be offered to RoomMind. They may take them or not. |
| Fix on the fork | Trial bugs and house-specific gaps are fixed here first. |
| RoomMind UI is the shell | Do not replace the panel with a new climate UI. |

## Sync upstream

```bash
git remote add upstream https://github.com/snazzybean/roommind.git   # once
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

Resolve conflicts in favor of keeping RoomMind defaults and behavior unless a documented fork option already exists and tests cover it.

## What this fork will not do

- Start a separate thermostat integration.
- Vendor or fork VTherm as the control brain.
- Change RoomMind’s default “smart source selection” (heat-pump-for-efficiency) for everyone.
- Land hydronic-first, zones, extra plant types, or an equipment graph before the live trial asks for that patch.
