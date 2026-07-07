from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.academic.constants import DurationUnit
from apps.academic.models import Program, SubProgram


def get_program_or_404(pk):
    return get_object_or_404(Program, pk=pk)


def list_programs():
    return Program.objects.all()


def create_program(*, name, slug, description="", supports_group=True, supports_individual=True):
    program = Program(
        name=name,
        slug=slug,
        description=description,
        supports_group=supports_group,
        supports_individual=supports_individual,
    )
    program.full_clean()
    program.save()
    return program


def update_program(program, **kwargs):
    for attr, value in kwargs.items():
        setattr(program, attr, value)
    program.full_clean()
    program.save()
    return program


def activate_program(program):
    program.is_active = True
    program.save()
    return program


def deactivate_program(program):
    program.is_active = False
    program.save()
    return program


def get_sub_program_or_404(pk):
    return get_object_or_404(SubProgram, pk=pk)


def list_sub_programs():
    return SubProgram.objects.select_related("program").all()


def create_sub_program(
    *,
    program,
    name,
    slug,
    description="",
    duration=None,
    duration_unit=None,
    fee,
):
    if duration_unit and duration_unit not in DurationUnit.values:
        raise DjangoValidationError(f"Invalid duration_unit: {duration_unit}")
    
    if duration is not None and duration <= 0:
        raise DjangoValidationError("Duration must be a positive integer.")
    
    sub_program = SubProgram(
        program=program,
        name=name,
        slug=slug,
        description=description,
        duration=duration,
        duration_unit=duration_unit,
        fee=fee,
    )
    sub_program.full_clean()
    sub_program.save()
    return sub_program


def update_sub_program(sub_program, **kwargs):
    if "duration_unit" in kwargs and kwargs["duration_unit"] not in DurationUnit.values:
        raise DjangoValidationError(f"Invalid duration_unit: {kwargs['duration_unit']}")
    if "duration" in kwargs and kwargs["duration"] is not None and kwargs["duration"] <= 0:
        raise DjangoValidationError("Duration must be a positive integer.")
    
    for attr, value in kwargs.items():
        if attr == "program" and value is not None:
            pass
        setattr(sub_program, attr, value)
    sub_program.full_clean()
    sub_program.save()
    return sub_program


def activate_sub_program(sub_program):
    sub_program.is_active = True
    sub_program.save()
    return sub_program


def deactivate_sub_program(sub_program):
    sub_program.is_active = False
    sub_program.save()
    return sub_program
