from django.contrib import admin

from .models import CropAdvisoryPrediction


@admin.register(CropAdvisoryPrediction)
class CropAdvisoryPredictionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "recommended_crop", "confidence", "created_at")
    list_filter = ("recommended_crop", "created_at")
    search_fields = ("user__username", "recommended_crop")
