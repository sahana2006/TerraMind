from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "phone_number", "role", "created_at")
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone_number",
            "role",
            "password",
            "confirm_password",
        )
        extra_kwargs = {
            "password": {"write_only": True, "min_length": 8},
            "role": {"required": False},
        }

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value.strip()

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def validate_phone_number(self, value):
        phone_number = value.strip()
        if len(phone_number) < 7:
            raise serializers.ValidationError("Enter a valid phone number.")
        return phone_number

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.pop("confirm_password", None)
        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        role = attrs.get("role") or User.ROLE_FARMER
        if role not in dict(User.ROLE_CHOICES):
            raise serializers.ValidationError({"role": "Invalid role selected."})
        attrs["role"] = role
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data
