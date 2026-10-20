"""Shared Home Assistant device identity for a RoomMind zone."""

from __future__ import annotations

from typing import cast

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers.entity import DeviceInfo

from .const import DOMAIN
from .coordinator import RoomMindCoordinator


def _get_area_name(hass: HomeAssistant, area_id: str) -> str:
    """Area name from the registry, or the area id when the area is gone."""
    area = ar.async_get(hass).async_get_area(area_id) if hass is not None else None
    if area is not None and area.name:
        return cast(str, area.name)
    return area_id


def room_device_info(area_id: str, name: str | None = None) -> DeviceInfo:
    """One device per zone. The room climate is its main entity."""
    return DeviceInfo(
        identifiers={(DOMAIN, f"zone_{area_id}")},
        name=name or area_id,
        manufacturer="RoomMind",
        model="Zone thermostat",
    )


def room_device_name(coordinator: RoomMindCoordinator, area_id: str) -> str:
    """Display name stored on the room, then the Home Assistant area name."""
    store = coordinator.hass.data.get(DOMAIN, {}).get("store") if coordinator.hass else None
    room = store.get_room(area_id) if store is not None else None
    if room and room.get("display_name"):
        return cast(str, room["display_name"])
    if coordinator.hass is not None:
        return _get_area_name(coordinator.hass, area_id)
    return area_id
