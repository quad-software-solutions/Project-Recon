from django.urls import path

from apps.academic.views import (
    ClassActivateView,
    ClassAssignInstructorView,
    ClassDeactivateView,
    ClassListCreateView,
    ClassRetrieveUpdateView,
    ProgramActivateView,
    ProgramDeactivateView,
    ProgramListCreateView,
    ProgramRetrieveUpdateView,
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
]
