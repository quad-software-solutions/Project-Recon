from django.db import models


class NewsType(models.TextChoices):
    NEWS = "NEWS", "News"
    ANNOUNCEMENT = "ANNOUNCEMENT", "Announcement"


class PartnerType(models.TextChoices):
    SPONSOR = "SPONSOR", "Sponsor"
    PARTNER = "PARTNER", "Partner"


class ContactStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


class ContactPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"


class MapNodeCategory(models.TextChoices):
    CHAMPIONSHIP = "CHAMPIONSHIP", "Championship"
    ACADEMIC = "ACADEMIC", "Academic"
    RESEARCH = "RESEARCH", "Research"
    STRATEGY = "STRATEGY", "Strategy"
    ALLIANCE = "ALLIANCE", "Alliance"
