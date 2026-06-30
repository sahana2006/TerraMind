"""Farm-aware agent node for the TerraMind AI Advisor."""

from __future__ import annotations

import logging
from typing import Any

from apps.farms.models import Farm

from ..graph.state import AIAdvisorState

logger = logging.getLogger(__name__)


def _to_native(value: Any) -> Any:
    """Convert Django/decimal values into JSON-friendly primitives."""

    if hasattr(value, "isoformat"):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    if isinstance(value, tuple):
        return list(value)
    return value


def _serialize_farm(farm: Farm) -> dict[str, Any]:
    """Serialize a farm record into a structured context dictionary."""

    coordinates = {
        "latitude": _to_native(farm.latitude),
        "longitude": _to_native(farm.longitude),
    }

    return {
        "id": farm.id,
        "name": farm.name,
        "location": farm.address or "",
        "current_crop": farm.primary_crop,
        "soil_type": farm.soil_type,
        "soil_ph": None,
        "area": _to_native(farm.area),
        "coordinates": coordinates,
        "created_at": _to_native(farm.created_at),
    }


def retrieve_user_farm_context(user_id: int | None) -> dict[str, Any]:
    """Return the authenticated user's farm context as a structured dictionary.

    Users without farms, anonymous users, or missing user ids receive an empty
    context so downstream nodes can continue normally.
    """

    if not user_id:
        logger.debug("Farm agent skipped because no authenticated user id was provided")
        return {"user_id": None, "farm_count": 0, "farms": []}

    farms = Farm.objects.filter(user_id=user_id).order_by("-created_at")
    farm_items = [_serialize_farm(farm) for farm in farms]

    context = {
        "user_id": user_id,
        "farm_count": len(farm_items),
        "farms": farm_items,
    }

    if not farm_items:
        logger.debug("No farms found for user_id=%s", user_id)
        return context

    logger.debug("Retrieved %s farm(s) for user_id=%s", len(farm_items), user_id)
    return context


def format_farm_context_text(farm_context: dict[str, Any]) -> str:
    """Render farm context into a prompt-friendly text block."""

    farms = farm_context.get("farms") or []
    if not farms:
        return ""

    lines = ["User farm context:"]
    for index, farm in enumerate(farms, start=1):
        coordinates = farm.get("coordinates") or {}
        lines.extend(
            [
                f"Farm {index}:",
                f"Name: {farm.get('name', '')}",
                f"Location: {farm.get('location', '') or 'Not provided'}",
                f"Current crop: {farm.get('current_crop', '') or 'Not provided'}",
                f"Soil type: {farm.get('soil_type', '') or 'Not provided'}",
                f"Soil pH: {farm.get('soil_ph') if farm.get('soil_ph') is not None else 'Not available'}",
                f"Area: {farm.get('area', '')}",
                f"Coordinates: {coordinates.get('latitude', '')}, {coordinates.get('longitude', '')}",
            ]
        )
        if farm.get("created_at"):
            lines.append(f"Created at: {farm['created_at']}")
        lines.append("")

    return "\n".join(lines).strip()


def farm_agent_node(state: AIAdvisorState) -> dict[str, Any]:
    """Attach the current user's farm context to the shared workflow state."""

    user_id = state.get("request_user_id")
    farm_context = retrieve_user_farm_context(user_id)
    farm_context_text = format_farm_context_text(farm_context)

    return {
        "farm_context": farm_context,
        "farm_context_text": farm_context_text,
        "next_node": "rag_agent",
    }
