from django.urls import path

from .views import CurrentWeatherView, ForecastWeatherView, WeatherIntelligenceView


urlpatterns = [
    path("current/<int:farm_id>/", CurrentWeatherView.as_view(), name="weather-current"),
    path("forecast/<int:farm_id>/", ForecastWeatherView.as_view(), name="weather-forecast"),
    path("intelligence/<int:farm_id>/", WeatherIntelligenceView.as_view(), name="weather-intelligence"),
]
