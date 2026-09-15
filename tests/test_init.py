"""Tests for RoomMind integration setup and unload."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.roommind import async_unload_entry
from custom_components.roommind.const import DOMAIN


@pytest.mark.asyncio
async def test_unload_shuts_down_coordinator_and_removes_panel(hass, mock_config_entry):
    """Last-entry unload must stop the coordinator and remove the sidebar panel.

    Store and panel_registered used to keep hass.data[DOMAIN] non-empty, so the
    panel was never removed and the DataUpdateCoordinator timer kept running.
    """
    coordinator = MagicMock()
    coordinator.async_shutdown = AsyncMock()
    hass.data[DOMAIN] = {
        mock_config_entry.entry_id: coordinator,
        "coordinator": coordinator,
        "store": MagicMock(),
        "panel_registered": True,
    }

    with patch("custom_components.roommind.async_remove_panel") as remove_panel:
        ok = await async_unload_entry(hass, mock_config_entry)

    assert ok is True
    coordinator.async_shutdown.assert_awaited_once()
    remove_panel.assert_called_once_with(hass, "roommind")
    assert mock_config_entry.entry_id not in hass.data[DOMAIN]
    assert "coordinator" not in hass.data[DOMAIN]
    assert hass.data[DOMAIN].get("panel_registered") is not True
    assert "store" in hass.data[DOMAIN]


@pytest.mark.asyncio
async def test_unload_does_not_remove_panel_when_another_entry_remains(hass, mock_config_entry):
    """Unloading one entry must not tear down a still-running sibling."""
    coordinator = MagicMock()
    coordinator.async_shutdown = AsyncMock()
    other = MagicMock()
    hass.data[DOMAIN] = {
        mock_config_entry.entry_id: coordinator,
        "other_entry": other,
        "coordinator": coordinator,
        "store": MagicMock(),
        "panel_registered": True,
    }

    with patch("custom_components.roommind.async_remove_panel") as remove_panel:
        ok = await async_unload_entry(hass, mock_config_entry)

    assert ok is True
    coordinator.async_shutdown.assert_awaited_once()
    remove_panel.assert_not_called()
    assert hass.data[DOMAIN]["panel_registered"] is True
    assert hass.data[DOMAIN]["other_entry"] is other
