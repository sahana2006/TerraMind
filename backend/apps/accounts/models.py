from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_FARMER = "Farmer"
    ROLE_ADMIN = "Admin"

    ROLE_CHOICES = (
        (ROLE_FARMER, "Farmer"),
        (ROLE_ADMIN, "Admin"),
    )

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_FARMER)
    created_at = models.DateTimeField(auto_now_add=True)

    REQUIRED_FIELDS = ["email", "phone_number"]

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
