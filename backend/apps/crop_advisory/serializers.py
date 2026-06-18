from rest_framework import serializers

from .models import CropAdvisoryPrediction


class CropRecommendationInputSerializer(serializers.Serializer):
    nitrogen = serializers.FloatField(min_value=0)
    phosphorus = serializers.FloatField(min_value=0)
    potassium = serializers.FloatField(min_value=0)
    temperature = serializers.FloatField()
    humidity = serializers.FloatField(min_value=0)
    ph = serializers.FloatField(min_value=0, max_value=14)
    rainfall = serializers.FloatField(min_value=0)


class CropAdvisoryPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropAdvisoryPrediction
        fields = (
            "id",
            "nitrogen",
            "phosphorus",
            "potassium",
            "temperature",
            "humidity",
            "ph",
            "rainfall",
            "recommended_crop",
            "confidence",
            "top_predictions",
            "feature_contributions",
            "created_at",
        )
        read_only_fields = fields
