"""URL routes for disease detection inference."""

from django.urls import path

from .views import DiseasePredictionAPIView


urlpatterns = [
    path("predict/", DiseasePredictionAPIView.as_view(), name="disease-predict"),
]
