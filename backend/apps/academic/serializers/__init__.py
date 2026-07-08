from apps.academic.serializers.program import ProgramSerializer, ProgramListSerializer
from apps.academic.serializers.sub_program import SubProgramSerializer, SubProgramListSerializer
from apps.academic.serializers.class_serializer import (
    ClassSerializer,
    ClassListSerializer,
    AssignInstructorSerializer,
)
from apps.academic.serializers.student import (
    StudentSerializer,
    StudentListSerializer,
    StudentUpdateSerializer,
)
from apps.academic.serializers.admission import AdmitStudentSerializer
from apps.academic.serializers.enrollment_period import (
    EnrollmentPeriodSerializer,
    EnrollmentPeriodListSerializer,
)
from apps.academic.serializers.staff_attendance import (
    StaffAttendanceSessionSerializer,
    StaffAttendanceSessionListSerializer,
    StaffAttendanceRecordSerializer,
    StaffAttendanceRecordUpsertSerializer,
    AvailableStaffSerializer,
    PublishSessionSerializer,
)
from apps.academic.serializers.enrollment import (
    EnrollmentSerializer,
    EnrollmentListSerializer,
    EnrollStudentSerializer,
    OnlineEnrollmentSerializer,
)
from apps.academic.serializers.payment import (
    EnrollmentPaymentSerializer,
    EnrollmentPaymentListSerializer,
    CashPaymentSerializer,
    OnlinePaymentVerifySerializer,
)
from apps.academic.serializers.attendance import (
    AttendanceSessionSerializer,
    AttendanceSessionListSerializer,
    AttendanceRecordSerializer,
    AttendanceRecordBulkSerializer,
    AttendanceSummarySerializer,
)
from apps.academic.serializers.progress import (
    LearningMilestoneSerializer,
    LearningMilestoneListSerializer,
    CustomizeMilestoneSerializer,
    StudentProgressSerializer,
    RecordProgressSerializer,
    UpdateProgressSerializer,
    ProgressSummarySerializer,
)
from apps.academic.serializers.learning_material import (
    LearningMaterialSerializer,
    LearningMaterialListSerializer,
)
from apps.academic.serializers.certificate import (
    CertificateSerializer,
    CertificateListSerializer,
    IssueCertificateSerializer,
    StudentCertificateSerializer,
    StudentCertificateListSerializer,
    PublicCertificateVerifySerializer,
)
from apps.academic.serializers.academic_report import ReportQuerySerializer

__all__ = [
    "ProgramSerializer",
    "ProgramListSerializer",
    "SubProgramSerializer",
    "SubProgramListSerializer",
    "ClassSerializer",
    "ClassListSerializer",
    "AssignInstructorSerializer",
    "StudentSerializer",
    "StudentListSerializer",
    "StudentUpdateSerializer",
    "AdmitStudentSerializer",
    "EnrollmentPeriodSerializer",
    "EnrollmentPeriodListSerializer",
    "StaffAttendanceSessionSerializer",
    "StaffAttendanceSessionListSerializer",
    "StaffAttendanceRecordSerializer",
    "StaffAttendanceRecordUpsertSerializer",
    "AvailableStaffSerializer",
    "PublishSessionSerializer",
    "EnrollmentSerializer",
    "EnrollmentListSerializer",
    "EnrollStudentSerializer",
    "OnlineEnrollmentSerializer",
    "EnrollmentPaymentSerializer",
    "EnrollmentPaymentListSerializer",
    "CashPaymentSerializer",
    "OnlinePaymentVerifySerializer",
    "AttendanceSessionSerializer",
    "AttendanceSessionListSerializer",
    "AttendanceRecordSerializer",
    "AttendanceRecordBulkSerializer",
    "AttendanceSummarySerializer",
    "LearningMilestoneSerializer",
    "LearningMilestoneListSerializer",
    "CustomizeMilestoneSerializer",
    "StudentProgressSerializer",
    "RecordProgressSerializer",
    "UpdateProgressSerializer",
    "ProgressSummarySerializer",
    "LearningMaterialSerializer",
    "LearningMaterialListSerializer",
    "CertificateSerializer",
    "CertificateListSerializer",
    "IssueCertificateSerializer",
    "StudentCertificateSerializer",
    "StudentCertificateListSerializer",
    "PublicCertificateVerifySerializer",
    "ReportQuerySerializer",
]
