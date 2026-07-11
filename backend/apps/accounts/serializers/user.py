"""User serializers for accounts API."""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from apps.accounts.constants import Gender, Roles
from apps.accounts.models import User, UserAssignment


class UserAssignmentNestedSerializer(serializers.ModelSerializer):
    """Read-only nested assignment summary on user detail responses."""

    branch_id = serializers.UUIDField(source="branch.id", read_only=True, allow_null=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True, allow_null=True)

    class Meta:
        model = UserAssignment
        fields = ("id", "branch_id", "branch_name", "role", "is_primary", "is_active")


class UserSerializer(serializers.ModelSerializer):
    """User output serializer — never exposes password."""

    full_name = serializers.CharField(read_only=True)
    assignments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "profile_picture",
            "date_of_birth",
            "gender",
            "status",
            "is_email_verified",
            "created_at",
            "updated_at",
            "assignments",
        )
        read_only_fields = fields

    def get_assignments(self, obj) -> list:
        """Return active assignments only. Uses in-Python filtering on prefetched data to avoid N+1 queries."""
        active = [a for a in obj.assignments.all() if a.is_active]
        return UserAssignmentNestedSerializer(active, many=True).data


class UserUpdateSerializer(serializers.Serializer):
    """Validate profile fields for UserService.update_user."""

    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=Gender.choices, required=False, allow_null=True)
    


class CreateStaffUserSerializer(serializers.Serializer):
    """Validate staff user creation request."""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True, min_length=8)
    branch_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=Roles.choices, default=Roles.INSTRUCTOR)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    gender = serializers.ChoiceField(choices=Gender.choices, required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)


class CreateBranchManagerSerializer(serializers.Serializer):
    """Validate branch manager creation request."""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True, min_length=8)
    branch_id = serializers.UUIDField()
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    gender = serializers.ChoiceField(choices=Gender.choices, required=False, allow_null=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)


class ChangeEmailSerializer(serializers.Serializer):
    """Validate email change request."""

    new_email = serializers.EmailField()


class UserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        user = self.context["request"].user

        current_password = attrs["current_password"]
        new_password = attrs["new_password"]

        if not user.check_password(current_password):
            raise serializers.ValidationError(
                {"current_password": "Current password is incorrect."}
            )

        if current_password == new_password:
            raise serializers.ValidationError(
                {"new_password": "The new password must be different from the current password."}
            )

        validate_password(new_password, user=user)

        return attrs