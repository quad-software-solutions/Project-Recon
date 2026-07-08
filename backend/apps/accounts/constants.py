"""Application-wide role, status, and enum constants for accounts."""

from django.db import models


class Roles(models.TextChoices):
    """Platform roles stored as application constants (not DB entities)."""

    SUPER_ADMIN = "super_admin", "Super Admin"
    BRANCH_MANAGER = "branch_manager", "Branch Manager"
    SECRETARY = "secretary", "Secretary"
    INSTRUCTOR = "instructor", "Instructor"
    STUDENT = "student", "Student"


class AccountStatus(models.TextChoices):
    """User account lifecycle states."""

    PENDING = "Pending", "Pending"
    ACTIVE = "Active", "Active"
    SUSPENDED = "Suspended", "Suspended"
    ARCHIVED = "Archived", "Archived"


class BranchStatus(models.TextChoices):
    """Branch operational states."""

    ACTIVE = "Active", "Active"
    INACTIVE = "Inactive", "Inactive"
    ARCHIVED = "Archived", "Archived"


class Gender(models.TextChoices):
    """User gender options."""

    MALE = "Male", "Male"
    FEMALE = "Female", "Female"
    PREFER_NOT_TO_SAY = "Prefer not to say", "Prefer not to say"


class OTPPurpose(models.TextChoices):
    """Supported OTP challenge purposes."""

    EMAIL_VERIFICATION = "EMAIL_VERIFICATION", "Email Verification"
    DEVICE_VERIFICATION = "DEVICE_VERIFICATION", "Device Verification"
    PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"


class DeviceType(models.TextChoices):
    """Trusted device categories."""

    DESKTOP = "Desktop", "Desktop"
    LAPTOP = "Laptop", "Laptop"
    MOBILE = "Mobile", "Mobile"
    TABLET = "Tablet", "Tablet"
    OTHER = "Other", "Other"


class LoginAttemptStatus(models.TextChoices):
    """Login attempt outcome labels."""

    SUCCESS = "SUCCESS", "Success"
    FAILED = "FAILED", "Failed"
    LOCKED = "LOCKED", "Locked"
