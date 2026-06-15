"""Weather alert engine for farmer-friendly forecast warnings."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterable, Mapping, Sequence


def _safe_float(value: Any) -> float | None:
    """Convert a value to float if possible, otherwise return ``None``."""

    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _as_forecast_rows(forecast_data: Sequence[Mapping[str, Any]] | Iterable[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
    """Normalize forecast input into a list of mapping rows."""

    if forecast_data is None:
        return []
    if isinstance(forecast_data, list):
        return [row for row in forecast_data if isinstance(row, Mapping)]
    return [row for row in forecast_data if isinstance(row, Mapping)]


@dataclass(slots=True)
class WeatherAlertEngine:
    """Generate deterministic weather alerts from forecast data."""

    forecast_data: Sequence[Mapping[str, Any]] | Iterable[Mapping[str, Any]] = field(default_factory=list)
    forecast_rows: list[Mapping[str, Any]] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.forecast_rows = _as_forecast_rows(self.forecast_data)

    def detect_heavy_rain(self) -> dict[str, str] | None:
        """Detect heavy rainfall in any daily forecast row."""

        for row in self.forecast_rows:
            rainfall = _safe_float(row.get("rainfall"))
            if rainfall is not None and rainfall > 80.0:
                return {
                    "type": "Heavy Rain",
                    "severity": "High",
                    "message": "Heavy rainfall expected. Ensure proper field drainage.",
                }
        return None

    def detect_heatwave(self) -> dict[str, str] | None:
        """Detect extreme heat in any daily forecast row."""

        for row in self.forecast_rows:
            temperature = _safe_float(row.get("temperature"))
            if temperature is not None and temperature > 40.0:
                return {
                    "type": "Heatwave",
                    "severity": "High",
                    "message": "Extreme heat expected. Monitor crop moisture levels.",
                }
        return None

    def detect_strong_wind(self) -> dict[str, str] | None:
        """Detect strong wind in any daily forecast row."""

        for row in self.forecast_rows:
            wind_speed = _safe_float(row.get("wind_speed"))
            if wind_speed is not None and wind_speed > 40.0:
                return {
                    "type": "Strong Wind",
                    "severity": "Moderate",
                    "message": "Strong winds expected. Secure vulnerable crops and equipment.",
                }
        return None

    def generate_alerts(self) -> list[dict[str, str]]:
        """Return all triggered alerts in a stable, deterministic order."""

        alerts: list[dict[str, str]] = []

        for detector in (self.detect_heavy_rain, self.detect_heatwave, self.detect_strong_wind):
            alert = detector()
            if alert is not None and alert not in alerts:
                alerts.append(alert)

        return alerts
