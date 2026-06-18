from django.urls import path

from .views import CropRecommendationHistoryView, CropRecommendationView


urlpatterns = [
    path("predict/", CropRecommendationView.as_view(), name="crop-predict"),
    path("history/", CropRecommendationHistoryView.as_view(), name="crop-history"),
]
