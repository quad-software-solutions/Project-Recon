from apps.academic.views.program import (
    ProgramListCreateView,
    ProgramRetrieveUpdateView,
    ProgramActivateView,
    ProgramDeactivateView,
)
from apps.academic.views.sub_program import (
    SubProgramListCreateView,
    SubProgramRetrieveUpdateView,
    SubProgramActivateView,
    SubProgramDeactivateView,
)
from apps.academic.views.class_view import (
    ClassListCreateView,
    ClassRetrieveUpdateView,
    ClassAssignInstructorView,
    ClassActivateView,
    ClassDeactivateView,
)

__all__ = [
    "ProgramListCreateView",
    "ProgramRetrieveUpdateView",
    "ProgramActivateView",
    "ProgramDeactivateView",
    "SubProgramListCreateView",
    "SubProgramRetrieveUpdateView",
    "SubProgramActivateView",
    "SubProgramDeactivateView",
    "ClassListCreateView",
    "ClassRetrieveUpdateView",
    "ClassAssignInstructorView",
    "ClassActivateView",
    "ClassDeactivateView",
]
