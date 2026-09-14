"""HACS install contract: zip_release needs a published roommind.zip asset."""

from __future__ import annotations

import json
from pathlib import Path

from awesomeversion import AwesomeVersion

from custom_components.roommind.const import VERSION

ROOT = Path(__file__).resolve().parents[1]


def _hacs_manifest() -> dict:
    return json.loads((ROOT / "hacs.json").read_text(encoding="utf-8"))


def _integration_manifest() -> dict:
    return json.loads((ROOT / "custom_components" / "roommind" / "manifest.json").read_text(encoding="utf-8"))


def test_hacs_zip_release_hides_default_branch() -> None:
    """Commit installs 404 when zip_release is true; hide the default branch.

    HACS downloads https://github.com/<repo>/releases/download/<version>/roommind.zip
    whenever zip_release is set. This fork has no GitHub releases, so installing
    commit 85cc1ae fails with "Could not download, see log for details".
    hide_default_branch stops HACS offering that broken commit path.
    """
    hacs = _hacs_manifest()
    assert hacs["zip_release"] is True
    assert hacs["filename"] == "roommind.zip"
    assert hacs["hide_default_branch"] is True


def test_release_workflow_publishes_hacs_zip_on_main_push() -> None:
    """A fork with no manual releases must publish roommind.zip on push to main."""
    hacs = _hacs_manifest()
    workflow = (ROOT / ".github/workflows/release.yml").read_text(encoding="utf-8")

    assert "push:" in workflow
    assert "gh release create" in workflow
    assert hacs["filename"] in workflow
    assert "npm run build" in workflow


def test_hacs_ci_ignores_fork_github_metadata_checks() -> None:
    """This fork has issues disabled and no GitHub topics; hacs/action must ignore those."""
    workflow = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
    hacs_job = workflow.split("hacs:")[1].split("hassfest:")[0]
    ignore = next(line.split(":", 1)[1].strip() for line in hacs_job.splitlines() if line.strip().startswith("ignore:"))
    ignored = set(ignore.split())
    assert {"issues", "topics"} <= ignored


def test_version_is_newer_than_stock_roommind() -> None:
    """HACS will not offer Follow if the fork still reports 1.7.6.

    Stock RoomMind and this fork both shipped 1.7.6. Release tags like
    v1.7.6-<sha> are prereleases, so AwesomeVersion treats them as older
    than 1.7.6 and Companion keeps the two-option setpoint dropdown.
    """
    manifest = _integration_manifest()
    assert manifest["version"] == VERSION
    assert AwesomeVersion(VERSION) > AwesomeVersion("1.7.6")


def test_panel_js_url_cache_busts_with_version() -> None:
    """Companion caches /roommind/roommind-panel.js across HACS redownloads."""
    init_py = (ROOT / "custom_components" / "roommind" / "__init__.py").read_text(encoding="utf-8")
    assert 'f"/roommind/roommind-panel.js?v={VERSION}"' in init_py


def test_setpoint_mode_dropdown_includes_follow() -> None:
    """Follow must be a third <ha-list-item> in the Devices setpoint dropdown."""
    source = (ROOT / "frontend" / "src" / "components" / "rs-device-section.ts").read_text(encoding="utf-8")
    assert 'value="follow"' in source
    assert source.count('value="follow"') >= 1
    assert "setpoint_mode_follow" in source
