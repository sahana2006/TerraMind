from __future__ import annotations

import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ml.predictor import CropModelError, predict_crop
from .models import CropAdvisoryPrediction
from .serializers import CropAdvisoryPredictionSerializer, CropRecommendationInputSerializer

logger = logging.getLogger(__name__)


class CropRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def _build_model_input(validated_data):
        return {
            "N": validated_data["nitrogen"],
            "P": validated_data["phosphorus"],
            "K": validated_data["potassium"],
            "temperature": validated_data["temperature"],
            "humidity": validated_data["humidity"],
            "ph": validated_data["ph"],
            "rainfall": validated_data["rainfall"],
        }

    def post(self, request, *args, **kwargs):
        input_serializer = CropRecommendationInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        try:
            prediction = predict_crop(self._build_model_input(input_serializer.validated_data))
        except (FileNotFoundError, CropModelError, ValueError, RuntimeError) as exc:
            logger.exception("Crop recommendation failed for user %s", request.user.id)
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        record = CropAdvisoryPrediction.objects.create(
            user=request.user,
            nitrogen=input_serializer.validated_data["nitrogen"],
            phosphorus=input_serializer.validated_data["phosphorus"],
            potassium=input_serializer.validated_data["potassium"],
            temperature=input_serializer.validated_data["temperature"],
            humidity=input_serializer.validated_data["humidity"],
            ph=input_serializer.validated_data["ph"],
            rainfall=input_serializer.validated_data["rainfall"],
            recommended_crop=prediction["recommended_crop"],
            confidence=prediction["confidence"],
            top_predictions=prediction["top_predictions"],
            feature_contributions=prediction["feature_contributions"],
        )

        return Response(
            {
                "prediction": CropAdvisoryPredictionSerializer(record).data,
                "message": "Crop recommendation saved successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class CropRecommendationHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CropAdvisoryPredictionSerializer

    def get_queryset(self):
        return CropAdvisoryPrediction.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception:
            logger.exception("Failed to load crop recommendation history for user %s", request.user.id)
            return Response(
                {"detail": "Unable to load crop recommendation history right now."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
