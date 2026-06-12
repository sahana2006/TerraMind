from rest_framework import serializers

from .models import Farm


class FarmSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Farm
        fields = (
            "id",
            "user",
            "name",
            "area",
            "soil_type",
            "primary_crop",
            "latitude",
            "longitude",
            "address",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Farm name is required.")
        return value

    def validate_soil_type(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Soil type is required.")
        return value

    def validate_primary_crop(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Primary crop is required.")
        return value

    def validate_address(self, value):
        if value is None:
            return value
        value = value.strip()
        return value or None

    def validate_area(self, value):
        if value <= 0:
            raise serializers.ValidationError("Area must be greater than zero.")
        return value

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value
