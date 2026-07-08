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
from apps.academic.views.staff_attendance import (
    SessionListCreateView,
    SessionDetailView,
    AvailableStaffView,
    SessionPublishView,
    RecordUpsertView,
    RecordDetailView,
)
from apps.academic.views.enrollment import (
    EnrollmentListCreateView,
    EnrollmentCancelView,
    EnrollmentCompleteView,
    OnlineEnrollmentView,
)
from apps.academic.views.payment import (
    PaymentListView,
    CashPaymentCreateView,
    OnlinePaymentVerifyView,
    OnlinePaymentWebhookView,
)
from apps.academic.views.attendance import (
    SessionListCreateView as AttendanceSessionListCreateView,
    SessionDetailView as AttendanceSessionDetailView,
    SessionRecordBulkView,
    RecordDetailView as AttendanceRecordDetailView,
    EnrollmentAttendanceHistoryView,
    EnrollmentAttendanceSummaryView,
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
    "SessionListCreateView",
    "SessionDetailView",
    "AvailableStaffView",
    "SessionPublishView",
    "RecordUpsertView",
    "RecordDetailView",
    "EnrollmentListCreateView",
    "EnrollmentCancelView",
    "EnrollmentCompleteView",
    "OnlineEnrollmentView",
    "PaymentListView",
    "CashPaymentCreateView",
    "OnlinePaymentVerifyView",
    "OnlinePaymentWebhookView",
    "AttendanceSessionListCreateView",
    "AttendanceSessionDetailView",
    "SessionRecordBulkView",
    "AttendanceRecordDetailView",
    "EnrollmentAttendanceHistoryView",
    "EnrollmentAttendanceSummaryView",
]
