from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.farms.models import Farm

from .serializers import CurrentWeatherSerializer, ForecastDaySerializer
from .services.intelligence_engine import generate_weather_intelligence
from .services.weather_service import WeatherService, WeatherServiceError


class FarmWeatherMixin:
    permission_classes = [IsAuthenticated]

    def get_farm(self, farm_id):
        return get_object_or_404(Farm, id=farm_id, user=self.request.user)

    def handle_service_error(self, error):
        return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)


class CurrentWeatherView(FarmWeatherMixin, APIView):
    def get(self, request, farm_id):
        farm = self.get_farm(farm_id)

        try:
            weather_data = WeatherService.get_current_weather(farm.latitude, farm.longitude)
        except WeatherServiceError as exc:
            return self.handle_service_error(exc)

        serializer = CurrentWeatherSerializer(data=weather_data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {
                "farm": {
                    "id": farm.id,
                    "name": farm.name,
                    "latitude": float(farm.latitude),
                    "longitude": float(farm.longitude),
                },
                **serializer.data,
            }
        )


class ForecastWeatherView(FarmWeatherMixin, APIView):
    def get(self, request, farm_id):
        farm = self.get_farm(farm_id)

        try:
            forecast_data = WeatherService.get_forecast(farm.latitude, farm.longitude)
        except WeatherServiceError as exc:
            return self.handle_service_error(exc)

        serializer = ForecastDaySerializer(data=forecast_data, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(
            {
                "farm": {
                    "id": farm.id,
                    "name": farm.name,
                    "latitude": float(farm.latitude),
                    "longitude": float(farm.longitude),
                },
                "forecast": serializer.data,
            }
        )


class WeatherIntelligenceView(FarmWeatherMixin, APIView):
    def get(self, request, farm_id):
        farm = self.get_farm(farm_id)

        try:
            intelligence = generate_weather_intelligence(farm.latitude, farm.longitude)
        except WeatherServiceError as exc:
            return self.handle_service_error(exc)

        return Response(intelligence)
