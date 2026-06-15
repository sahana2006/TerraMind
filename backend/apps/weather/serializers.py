from rest_framework import serializers


class CurrentWeatherSerializer(serializers.Serializer):
    temperature = serializers.FloatField()
    wind_speed = serializers.FloatField()
    weather_code = serializers.IntegerField()
    current_time = serializers.CharField()


class ForecastDaySerializer(serializers.Serializer):
    date = serializers.CharField()
    max_temperature = serializers.FloatField()
    min_temperature = serializers.FloatField()
    weather_code = serializers.IntegerField()

