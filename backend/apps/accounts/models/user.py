import uuid

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

from apps.accounts.constants import AccountStatus, Gender
from apps.accounts.validators import normalize_phone_number
from apps.shared.validators import UploadedFileValidator


class UserManager(BaseUserManager):
    """Custom manager for email-based User creation."""

    def create_user(self, email, password=None, **extra_fields):
        """
        Create and persist a user with normalized email.

        Args:
            email: Unique email address.
            password: Optional plain-text password.
            **extra_fields: Additional User model fields.

        Returns:
            Created User instance.
        """
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Django admin contract helper — prefer UserService.create_super_admin in application code.

        Returns:
            Created User with is_staff and is_superuser flags set.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


def profile_picture_path(instance, filename):
    ext = filename.split(".")[-1] if "." in filename else ""
    return f"profiles/{instance.id}_{uuid.uuid4().hex}.{ext}"


class User(AbstractBaseUser, PermissionsMixin):
    """
    Core identity model: authentication, profile fields, and account status.

    Roles and branch membership live on UserAssignment, not on this model.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to=profile_picture_path,
        null=True, blank=True,
        validators=[UploadedFileValidator()],
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING,
        db_index=True,
    )
    is_email_verified = models.BooleanField(default=False, db_index=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Django admin access only — RBAC is enforced via UserAssignment.
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    @property
    def full_name(self) -> str:
        """Return first and last name combined."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def initials(self) -> str:
        """Return uppercased first letters of first and last name."""
        first = self.first_name[0].upper() if self.first_name else ""
        last = self.last_name[0].upper() if self.last_name else ""
        return f"{first}{last}"

    @property
    def is_active_account(self) -> bool:
        """True only when account status is Active."""
        return self.status == AccountStatus.ACTIVE

    def save(self, *args, **kwargs):
        """Normalize email and phone before persisting."""
        if self.email:
            self.email = self.email.strip().lower()
        if self.phone_number:
            self.phone_number = normalize_phone_number(self.phone_number)
        super().save(*args, **kwargs)

    
    class Meta:
        ordering = ["-created_at"]
        db_table = "accounts_user"
