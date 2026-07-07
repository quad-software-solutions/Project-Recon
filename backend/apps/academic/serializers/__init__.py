from apps.academic.serializers.program import ProgramSerializer, ProgramListSerializer
from apps.academic.serializers.sub_program import SubProgramSerializer, SubProgramListSerializer
from apps.academic.serializers.class_serializer import (
    ClassSerializer,
    ClassListSerializer,
    AssignInstructorSerializer,
)

__all__ = [
    "ProgramSerializer",
    "ProgramListSerializer",
    "SubProgramSerializer",
    "SubProgramListSerializer",
    "ClassSerializer",
    "ClassListSerializer",
    "AssignInstructorSerializer",
]
