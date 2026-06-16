"""REST API views for disease detection inference."""

from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path

from PIL import Image, UnidentifiedImageError
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .ml.image_utils import ImagePreprocessingError
from .ml.predictor import DiseaseModelError
from .serializers import DiseasePredictionSerializer
from .services.prediction_service import predict_leaf_disease

logger = logging.getLogger(__name__)


class DiseasePredictionAPIView(APIView):
    """Accept a leaf image and return the predicted disease label."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    @staticmethod
    def _persist_upload(uploaded_file) -> Path:
        """Store the uploaded file on disk for temporary inference use."""

        suffix = Path(uploaded_file.name).suffix or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            return Path(temp_file.name)

    @staticmethod
    def _remove_temp_file(temp_path: Path) -> None:
        """Best-effort cleanup for temporary uploads."""

        try:
            if temp_path.exists():
                temp_path.unlink()
        except OSError:
            logger.warning("Unable to remove temporary file: %s", temp_path)

    def post(self, request, *args, **kwargs):
        """Handle an uploaded image and return the model prediction."""

        serializer = DiseasePredictionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid image file."}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_image = serializer.validated_data["image"]
        temp_path = self._persist_upload(uploaded_image)

        try:
            try:
                with Image.open(temp_path) as image:
                    image.verify()
            except (UnidentifiedImageError, OSError, ValueError):
                return Response({"error": "Invalid image file."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                prediction = predict_leaf_disease(temp_path)
            except (ImagePreprocessingError, DiseaseModelError, FileNotFoundError, ValueError, RuntimeError):
                logger.exception("Disease prediction failed for uploaded image: %s", uploaded_image.name)
                return Response({"error": "Prediction failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(prediction, status=status.HTTP_200_OK)
        finally:
            self._remove_temp_file(temp_path)
