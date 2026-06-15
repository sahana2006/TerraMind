from dataclasses import dataclass

import requests


class WeatherServiceError(Exception):
    """Raised when the Open-Meteo request or payload validation fails."""


@dataclass(frozen=True)
class WeatherRequestConfig:
    latitude: float
    longitude: float
    current_params: tuple[str, ...] = ("temperature_2m", "wind_speed_10m", "weather_code")
    daily_params: tuple[str, ...] = ("weather_code", "temperature_2m_max", "temperature_2m_min")
    forecast_days: int = 7


class WeatherService:
    """Encapsulates Open-Meteo access for live weather data."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    REQUEST_TIMEOUT = 10

    @classmethod
    def _request_weather(cls, params):
        try:
            response = requests.get(cls.BASE_URL, params=params, timeout=cls.REQUEST_TIMEOUT)
            response.raise_for_status()
        except requests.Timeout as exc:
            raise WeatherServiceError("Open-Meteo request timed out.") from exc
        except requests.RequestException as exc:
            raise WeatherServiceError("Unable to reach Open-Meteo weather service.") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise WeatherServiceError("Open-Meteo returned an invalid response.") from exc

        if payload.get("error"):
            reason = payload.get("reason") or "Open-Meteo returned an error."
            raise WeatherServiceError(reason)

        return payload

    @classmethod
    def get_current_weather(cls, latitude, longitude):
        config = WeatherRequestConfig(latitude=latitude, longitude=longitude)
        payload = cls._request_weather(
            {
                "latitude": config.latitude,
                "longitude": config.longitude,
                "current": ",".join(config.current_params),
                "timezone": "auto",
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "timeformat": "iso8601",
            }
        )

        current = payload.get("current")
        if not isinstance(current, dict):
            raise WeatherServiceError("Open-Meteo did not return current weather data.")

        try:
            return {
                "temperature": current["temperature_2m"],
                "wind_speed": current["wind_speed_10m"],
                "weather_code": current["weather_code"],
                "current_time": current["time"],
            }
        except KeyError as exc:
            raise WeatherServiceError("Open-Meteo current weather payload is incomplete.") from exc

    @classmethod
    def get_forecast(cls, latitude, longitude):
        config = WeatherRequestConfig(latitude=latitude, longitude=longitude)
        payload = cls._request_weather(
            {
                "latitude": config.latitude,
                "longitude": config.longitude,
                "daily": ",".join(config.daily_params),
                "forecast_days": config.forecast_days,
                "timezone": "auto",
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "timeformat": "iso8601",
            }
        )

        daily = payload.get("daily")
        if not isinstance(daily, dict):
            raise WeatherServiceError("Open-Meteo did not return forecast data.")

        try:
            dates = daily["time"]
            max_temps = daily["temperature_2m_max"]
            min_temps = daily["temperature_2m_min"]
            weather_codes = daily["weather_code"]
        except KeyError as exc:
            raise WeatherServiceError("Open-Meteo forecast payload is incomplete.") from exc

        forecast = []
        for date, max_temp, min_temp, weather_code in zip(dates, max_temps, min_temps, weather_codes):
            forecast.append(
                {
                    "date": date,
                    "max_temperature": max_temp,
                    "min_temperature": min_temp,
                    "weather_code": weather_code,
                }
            )

        return forecast

    @classmethod
    def get_intelligence_forecast(cls, latitude, longitude):
        """Return expanded daily forecast data for intelligence engines.

        The returned payload is intentionally normalized for rule-based risk and
        alert engines. Missing fields are preserved as ``None`` so downstream
        code can handle them gracefully.
        """

        payload = cls._request_weather(
            {
                "latitude": latitude,
                "longitude": longitude,
                "daily": ",".join(
                    (
                        "temperature_2m_mean",
                        "relative_humidity_2m_mean",
                        "precipitation_sum",
                        "wind_speed_10m_max",
                    )
                ),
                "forecast_days": 7,
                "timezone": "auto",
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "precipitation_unit": "mm",
                "timeformat": "iso8601",
            }
        )

        daily = payload.get("daily")
        if not isinstance(daily, dict):
            return []

        dates = daily.get("time") or []
        temperatures = daily.get("temperature_2m_mean") or []
        humidities = daily.get("relative_humidity_2m_mean") or []
        rainfall = daily.get("precipitation_sum") or []
        wind_speed = daily.get("wind_speed_10m_max") or []

        forecast = []
        for index, date in enumerate(dates):
            forecast.append(
                {
                    "date": date,
                    "temperature": cls._coerce_optional_float(temperatures, index),
                    "humidity": cls._coerce_optional_float(humidities, index),
                    "rainfall": cls._coerce_optional_float(rainfall, index),
                    "wind_speed": cls._coerce_optional_float(wind_speed, index),
                }
            )

        return forecast

    @staticmethod
    def _coerce_optional_float(values, index):
        try:
            value = values[index]
        except (IndexError, TypeError):
            return None

        if value in (None, ""):
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None
