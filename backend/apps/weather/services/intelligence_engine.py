"""Compose current weather, forecast, risks, and alerts for the weather API."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping


from .weather_service import WeatherService, WeatherServiceError


@dataclass(slots=True)
class WeatherIntelligenceEngine:
    """Build the `/api/weather/intelligence/<farm_id>/` response payload."""

    latitude: float
    longitude: float

    def generate(self) -> dict[str, Any]:
        """Return current weather, forecast, risks, and alerts."""

        current_weather = WeatherService.get_current_weather(self.latitude, self.longitude)
        forecast = WeatherService.get_intelligence_forecast(self.latitude, self.longitude)


        return {
            "current_weather": current_weather,
            "forecast": forecast,
        }


def generate_weather_intelligence(latitude: float, longitude: float) -> dict[str, Any]:
    """Convenience wrapper for callers that prefer a functional interface."""

    return WeatherIntelligenceEngine(latitude=latitude, longitude=longitude).generate()

