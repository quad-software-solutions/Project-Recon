from django.db import models


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(models.TextChoices):
    CASH = "CASH"
    ONLINE = "ONLINE"


class PaymentProvider(models.TextChoices):
    CHAPA = "CHAPA"
    STRIPE = "STRIPE"
