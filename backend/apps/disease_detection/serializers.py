"""Serializers for disease detection image uploads."""

from rest_framework import serializers


class DiseasePredictionSerializer(serializers.Serializer):
    """Validate a single uploaded leaf image."""

    image = serializers.ImageField()
