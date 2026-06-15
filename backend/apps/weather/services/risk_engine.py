"""Weather risk assessment engine for agricultural intelligence.

This module converts daily forecast data into deterministic weather risk levels
for heat, rain, and wind. The logic is lightweight, rule-based, and designed to
accept partially missing forecast rows without failing.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from statistics import mean
from typing import Any, Iterable, Mapping, Sequence

RiskLevel = str


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
class WeatherRiskEngine:
    """Assess aggregate weather risk from a 7-day forecast."""

    forecast_data: Sequence[Mapping[str, Any]] | Iterable[Mapping[str, Any]] = field(default_factory=list)
    forecast_rows: list[Mapping[str, Any]] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.forecast_rows = _as_forecast_rows(self.forecast_data)

    def _levels_from_values(self, values: list[float], low_threshold: float, high_threshold: float) -> RiskLevel:
        if not values:
            return "Unknown"

        aggregate = mean(values)
        if aggregate < low_threshold:
            return "Low"
        if aggregate <= high_threshold:
            return "Moderate"
        return "High"

    def assess_heat_risk(self) -> RiskLevel:
        """Assess heat risk from average forecast temperature."""

        temperatures = [_safe_float(row.get("temperature")) for row in self.forecast_rows]
        values = [value for value in temperatures if value is not None]
        return self._levels_from_values(values, 30.0, 35.0)

    def assess_rain_risk(self) -> RiskLevel:
        """Assess rain risk from total forecast rainfall."""

        rainfall_values = [_safe_float(row.get("rainfall")) for row in self.forecast_rows]
        total_rainfall = sum(value for value in rainfall_values if value is not None)
        if not rainfall_values or all(value is None for value in rainfall_values):
            return "Unknown"
        if total_rainfall < 20.0:
            return "Low"
        if total_rainfall <= 50.0:
            return "Moderate"
        return "High"

    def assess_wind_risk(self) -> RiskLevel:
        """Assess wind risk from maximum forecast wind speed."""

        wind_values = [_safe_float(row.get("wind_speed")) for row in self.forecast_rows]
        values = [value for value in wind_values if value is not None]
        if not values:
            return "Unknown"

        max_wind_speed = max(values)
        if max_wind_speed < 20.0:
            return "Low"
        if max_wind_speed <= 40.0:
            return "Moderate"
        return "High"

    def generate_risk_report(self) -> dict[str, RiskLevel]:
        """Return a compact risk report for the forecast period."""

        return {
            "heat_risk": self.assess_heat_risk(),
            "rain_risk": self.assess_rain_risk(),
            "wind_risk": self.assess_wind_risk(),
        }
