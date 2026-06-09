from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "phone_number", "role", "is_staff", "created_at")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "phone_number")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)

    fieldsets = UserAdmin.fieldsets + (
        ("TerraMind Profile", {"fields": ("phone_number", "role")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("TerraMind Profile", {"fields": ("email", "phone_number", "role")}),
    )
