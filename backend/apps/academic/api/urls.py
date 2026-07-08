from django.urls import path

from apps.academic.views import (
    AdmitStudentView,
    ClassActivateView,
    ClassAssignInstructorView,
    ClassDeactivateView,
    ClassListCreateView,
    ClassRetrieveUpdateView,
    EnrollmentPeriodActivateView,
    EnrollmentPeriodDeactivateView,
    EnrollmentPeriodListCreateView,
    EnrollmentPeriodRetrieveUpdateView,
    ProgramActivateView,
    ProgramDeactivateView,
    ProgramListCreateView,
    ProgramRetrieveUpdateView,
    StudentActivateView,
    StudentDeactivateView,
    StudentRetrieveUpdateView,
    StudentSearchView,
    SubProgramActivateView,
    SubProgramDeactivateView,
    SubProgramListCreateView,
    SubProgramRetrieveUpdateView,
)

urlpatterns = [
    # Program
    path("programs/", ProgramListCreateView.as_view(), name="program-list-create"),
    path("programs/<uuid:pk>/", ProgramRetrieveUpdateView.as_view(), name="program-retrieve-update"),
    path("programs/<uuid:pk>/activate/", ProgramActivateView.as_view(), name="program-activate"),
    path("programs/<uuid:pk>/deactivate/", ProgramDeactivateView.as_view(), name="program-deactivate"),
    # Sub Program
    path("sub-programs/", SubProgramListCreateView.as_view(), name="sub-program-list-create"),
    path("sub-programs/<uuid:pk>/", SubProgramRetrieveUpdateView.as_view(), name="sub-program-retrieve-update"),
    path("sub-programs/<uuid:pk>/activate/", SubProgramActivateView.as_view(), name="sub-program-activate"),
    path("sub-programs/<uuid:pk>/deactivate/", SubProgramDeactivateView.as_view(), name="sub-program-deactivate"),
    # Class
    path("classes/", ClassListCreateView.as_view(), name="class-list-create"),
    path("classes/<uuid:pk>/", ClassRetrieveUpdateView.as_view(), name="class-retrieve-update"),
    path("classes/<uuid:pk>/assign-instructor/", ClassAssignInstructorView.as_view(), name="class-assign-instructor"),
    path("classes/<uuid:pk>/activate/", ClassActivateView.as_view(), name="class-activate"),
    path("classes/<uuid:pk>/deactivate/", ClassDeactivateView.as_view(), name="class-deactivate"),
    # Admission
    path("admissions/", AdmitStudentView.as_view(), name="admit-student"),
    # Student
    path("students/search/", StudentSearchView.as_view(), name="student-search"),
    path("students/<uuid:pk>/", StudentRetrieveUpdateView.as_view(), name="student-retrieve-update"),
    path("students/<uuid:pk>/activate/", StudentActivateView.as_view(), name="student-activate"),
    path("students/<uuid:pk>/deactivate/", StudentDeactivateView.as_view(), name="student-deactivate"),
    # Enrollment Period
    path("enrollment-periods/", EnrollmentPeriodListCreateView.as_view(), name="enrollment-period-list-create"),
    path("enrollment-periods/<uuid:pk>/", EnrollmentPeriodRetrieveUpdateView.as_view(), name="enrollment-period-retrieve-update"),
    path("enrollment-periods/<uuid:pk>/activate/", EnrollmentPeriodActivateView.as_view(), name="enrollment-period-activate"),
    path("enrollment-periods/<uuid:pk>/deactivate/", EnrollmentPeriodDeactivateView.as_view(), name="enrollment-period-deactivate"),
]
