"""HACS install contract: zip_release needs a published roommind.zip asset."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _hacs_manifest() -> dict:
    return json.loads((ROOT / "hacs.json").read_text(encoding="utf-8"))


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
