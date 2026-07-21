import uuid

from django.db import models

from apps.academic.constants import ClassPeriod, ClassType


class Class(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_program = models.ForeignKey(
        "academic.SubProgram", on_delete=models.PROTECT, related_name="classes"
    )
    branch = models.ForeignKey(
        "accounts.Branch", on_delete=models.PROTECT, related_name="classes"
    )
    instructor = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="classes"
    )
    name = models.CharField(max_length=255)
    class_type = models.CharField(max_length=10, choices=ClassType.choices, db_index=True)
    class_period = models.CharField(max_length=10, choices=ClassPeriod.choices, null=True, blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Class"
        verbose_name_plural = "Classes"

    def __str__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.class_type == ClassType.GROUP and not self.capacity:
            raise ValidationError({"capacity": "Capacity is required for Group classes."})
        if self.class_type == ClassType.GROUP and self.capacity and self.capacity < 1:
            raise ValidationError(
                {"capacity": "Capacity must be greater than zero for Group classes."}
            )
        if self.class_type == ClassType.INDIVIDUAL:
            self.capacity = 1

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
