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
from apps.academic.views.admission import AdmitStudentView
from apps.academic.views.student import (
    StudentRetrieveUpdateView,
    StudentSearchView,
    StudentActivateView,
    StudentDeactivateView,
)
from apps.academic.views.enrollment_period import (
    EnrollmentPeriodListCreateView,
    EnrollmentPeriodRetrieveUpdateView,
    EnrollmentPeriodActivateView,
    EnrollmentPeriodDeactivateView,
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
    "AdmitStudentView",
    "StudentRetrieveUpdateView",
    "StudentSearchView",
    "StudentActivateView",
    "StudentDeactivateView",
    "EnrollmentPeriodListCreateView",
    "EnrollmentPeriodRetrieveUpdateView",
    "EnrollmentPeriodActivateView",
    "EnrollmentPeriodDeactivateView",
]
