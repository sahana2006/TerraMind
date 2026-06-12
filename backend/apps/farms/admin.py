from django.contrib import admin

from .models import Farm


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "area", "soil_type", "primary_crop", "created_at")
    list_filter = ("soil_type", "primary_crop", "created_at")
    search_fields = ("name", "user__username", "soil_type", "primary_crop", "address")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
