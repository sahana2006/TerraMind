"""Weather-aware agent node for the TerraMind AI Advisor."""

from __future__ import annotations

import importlib.util
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..graph.state import AIAdvisorState

logger = logging.getLogger(__name__)

_WEATHER_SERVICE_MODULE_NAME = "_terramind_weather_service"
_WEATHER_SERVICE_PATH = Path(__file__).resolve().parents[2] / "weather" / "services" / "weather_service.py"


@lru_cache(maxsize=1)
def _load_weather_service_module():
    """Load the existing weather service module without importing the broken package init."""

    if not _WEATHER_SERVICE_PATH.exists():
        raise FileNotFoundError(f"Weather service module not found at {_WEATHER_SERVICE_PATH}")

    spec = importlib.util.spec_from_file_location(_WEATHER_SERVICE_MODULE_NAME, _WEATHER_SERVICE_PATH)
    if spec is None or spec.loader is None:
        raise ImportError("Unable to load the existing weather service module.")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@lru_cache(maxsize=1)
def _get_weather_service():
    """Return the existing WeatherService and WeatherServiceError classes."""

    module = _load_weather_service_module()
    return module.WeatherService, module.WeatherServiceError


def _to_float(value: Any) -> float | None:
    """Convert a value to float when possible."""

    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _describe_weather_code(weather_code: Any) -> str:
    """Translate a weather code into a short human-readable condition."""

    code = _to_float(weather_code)
    if code is None:
        return "Unknown"

    integer_code = int(code)
    if integer_code == 0:
        return "Clear sky"
    if integer_code in {1, 2, 3}:
        return "Partly cloudy"
    if integer_code in {45, 48}:
        return "Fog"
    if integer_code in {51, 53, 55, 56, 57}:
        return "Drizzle"
    if integer_code in {61, 63, 65, 66, 67}:
        return "Rain"
    if integer_code in {71, 73, 75, 77}:
        return "Snow"
    if integer_code in {80, 81, 82}:
        return "Rain showers"
    if integer_code in {85, 86}:
        return "Snow showers"
    if integer_code in {95, 96, 99}:
        return "Thunderstorm"
    return f"Weather code {integer_code}"



def _extract_location(farm_context: dict[str, Any] | None) -> tuple[float | None, float | None, str | None]:
    """Extract the most relevant farm location for weather lookup."""

    farms = (farm_context or {}).get("farms") or []
    if not farms:
        return None, None, None

    farm = farms[0]
    coordinates = farm.get("coordinates") or {}
    latitude = _to_float(coordinates.get("latitude"))
    longitude = _to_float(coordinates.get("longitude"))
    address = farm.get("location") or None
    return latitude, longitude, address


def retrieve_weather_context(
    latitude: float | None = None,
    longitude: float | None = None,
    *,
    address: str | None = None,
) -> dict[str, Any]:
    """Return a structured weather context using the existing weather service.

    The weather service requires coordinates, so an address alone is treated as
    descriptive context. If coordinates are missing or the weather service is
    unavailable, an empty weather context is returned.
    """

    empty_context = {
        "location": {"latitude": latitude, "longitude": longitude, "address": address},
        "current": {},
        "forecast_summary": [],
    }

    if latitude is None or longitude is None:
        logger.debug("Weather agent skipped because coordinates were unavailable for address=%s", address)
        return empty_context

    try:
        weather_service, weather_service_error = _get_weather_service()
        current_weather = weather_service.get_current_weather(latitude, longitude)
        forecast = weather_service.get_intelligence_forecast(latitude, longitude)
    except Exception as exc:
        if "weather_service_error" in locals() and isinstance(exc, weather_service_error):
            logger.warning("Weather service request failed: %s", exc)
        else:
            logger.exception("Unexpected weather agent failure")
        return empty_context

    humidity_values = []
    for day in forecast:
        humidity = _to_float(day.get("humidity"))
        if humidity is not None:
            humidity_values.append(humidity)
    humidity = round(sum(humidity_values) / len(humidity_values), 2) if humidity_values else None

    rainfall_values = []
    for day in forecast:
        rainfall = _to_float(day.get("rainfall"))
        if rainfall is not None:
            rainfall_values.append(rainfall)
    rainfall_probability = round(min(100.0, max(rainfall_values) * 10.0), 2) if rainfall_values else None

    current = {
        "temperature": _to_float(current_weather.get("temperature")),
        "humidity": humidity,
        "rainfall_probability": rainfall_probability,
        "wind_speed": _to_float(current_weather.get("wind_speed")),
        "weather_condition": _describe_weather_code(current_weather.get("weather_code")),
        "weather_code": _to_float(current_weather.get("weather_code")),
        "current_time": current_weather.get("current_time"),
    }


    weather_context = {
        "location": {"latitude": latitude, "longitude": longitude, "address": address},
        "current": current,
        "forecast_summary": forecast,
    }

    logger.debug("Weather context retrieved successfully for latitude=%s longitude=%s", latitude, longitude)
    return weather_context


def format_weather_context_text(weather_context: dict[str, Any]) -> str:
    """Render weather context into a prompt-friendly text block."""

    current = weather_context.get("current") or {}
    location = weather_context.get("location") or {}

    if not current:
        return ""

    lines = ["Weather context:"]
    lines.append(
        f"Location: {location.get('address') or 'Coordinates'} ({location.get('latitude', 'unknown')}, {location.get('longitude', 'unknown')})"
    )
    lines.append(f"Temperature: {current.get('temperature', 'Not available')} C")
    lines.append(f"Humidity: {current.get('humidity', 'Not available')} %")
    lines.append(f"Rainfall probability: {current.get('rainfall_probability', 'Not available')} %")
    lines.append(f"Wind speed: {current.get('wind_speed', 'Not available')} km/h")
    lines.append(f"Condition: {current.get('weather_condition', 'Unknown')}")

    return "\n".join(lines).strip()


def weather_agent_node(state: AIAdvisorState) -> dict[str, Any]:
    """Attach the current farm's weather context to the shared workflow state."""

    farm_context = state.get("farm_context") or {}
    latitude, longitude, address = _extract_location(farm_context)
    weather_context = retrieve_weather_context(latitude, longitude, address=address)
    weather_context_text = format_weather_context_text(weather_context)

    return {
        "weather_context": weather_context,
        "weather_context_text": weather_context_text,
        "next_node": "rag_agent",
    }
