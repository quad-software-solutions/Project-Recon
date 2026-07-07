from django.db import models


class ClassType(models.TextChoices):
    GROUP = "GROUP", "Group"
    INDIVIDUAL = "INDIVIDUAL", "Individual"


class DurationUnit(models.TextChoices):
    DAY = "DAY", "Day"
    WEEK = "WEEK", "Week"
    MONTH = "MONTH", "Month"
