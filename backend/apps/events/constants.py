from django.db import models


class EventStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    CANCELLED = "CANCELLED", "Cancelled"
    COMPLETED = "COMPLETED", "Completed"


class Visibility(models.TextChoices):
    PUBLIC = "PUBLIC", "Public"
    PRIVATE = "PRIVATE", "Private"


class RegistrationMode(models.TextChoices):
    NONE = "NONE", "None"
    PUBLIC = "PUBLIC", "Public"
    STUDENT = "STUDENT", "Student"
    SUBPROGRAM_STUDENT = "SUBPROGRAM_STUDENT", "Sub Program Student"


class EventType(models.TextChoices):
    GENERAL = "GENERAL", "General"
    TOURNAMENT = "TOURNAMENT", "Tournament"
    WORKSHOP = "WORKSHOP", "Workshop"


class WorkshopLevel(models.TextChoices):
    BEGINNER = "BEGINNER", "Beginner"
    INTERMEDIATE = "INTERMEDIATE", "Intermediate"
    ADVANCED = "ADVANCED", "Advanced"


class MatchStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Scheduled"
    LIVE = "LIVE", "Live"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class MatchSideType(models.TextChoices):
    SIDE_A = "SIDE_A", "Side A"
    SIDE_B = "SIDE_B", "Side B"


class RegistrationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"


class PaymentStatus(models.TextChoices):
    PENDING_VERIFICATION = "PENDING_VERIFICATION", "Pending Verification"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"


class PaymentMethod(models.TextChoices):
    CASH = "CASH", "Cash"
    BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
    MOBILE_MONEY = "MOBILE_MONEY", "Mobile Money"
    CHEQUE = "CHEQUE", "Cheque"
