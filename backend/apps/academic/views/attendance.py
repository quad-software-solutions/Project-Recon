from datetime import datetime

from django.core.exceptions import ValidationError as DjangoValidationError

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from django.shortcuts import get_object_or_404

from apps.academic.models import AttendanceSession, AttendanceRecord, Enrollment
from apps.academic.models.class_model import Class as ClassModel
from apps.academic.permissions.attendance import CanManageAttendance
from apps.accounts.permissions.roles import (
    get_active_branch_ids,
    user_is_branch_manager,
    user_is_instructor,
    user_is_secretary,
    user_is_super_admin,
)
from apps.academic.serializers import (
    AttendanceSessionSerializer,
    AttendanceSessionListSerializer,
    AttendanceRecordSerializer,
    AttendanceRecordBulkSerializer,
    AttendanceSummarySerializer,
)
from apps.academic.services.attendance_service import (
    create_session,
    get_session_or_404,
    list_sessions,
    update_session,
    bulk_record_attendance,
    record_attendance,
    update_attendance_record,
    get_enrollment_attendance_history,
    get_attendance_summary,
)


@extend_schema_view(
    get=extend_schema(summary="List Attendance Sessions", tags=["Academic - Attendance"]),
    post=extend_schema(summary="Create Attendance Session", tags=["Academic - Attendance"]),
)
class SessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanManageAttendance]
    throttle_scope = "academic_attendance"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return AttendanceSessionListSerializer
        return AttendanceSessionSerializer

    def get_queryset(self):
        user = self.request.user
        branch_ids = None
        instructor = None
        if user_is_super_admin(user):
            pass
        elif user_is_instructor(user):
            instructor = user
        else:
            branch_ids = get_active_branch_ids(user)

        enrolled_class = self.request.query_params.get("enrolled_class")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if enrolled_class:
            try:
                from uuid import UUID
                UUID(enrolled_class)
            except ValueError:
                raise ValidationError("Invalid enrolled_class UUID.")
        if date_from:
            try:
                datetime.strptime(date_from, "%Y-%m-%d").date()
            except ValueError:
                raise ValidationError("Invalid date_from format. Use YYYY-MM-DD.")
        if date_to:
            try:
                datetime.strptime(date_to, "%Y-%m-%d").date()
            except ValueError:
                raise ValidationError("Invalid date_to format. Use YYYY-MM-DD.")

        return list_sessions(
            enrolled_class=enrolled_class,
            date_from=date_from,
            date_to=date_to,
            branch_ids=branch_ids,
            instructor=instructor,
        )

    def perform_create(self, serializer):
        enrolled_class = get_object_or_404(ClassModel, pk=serializer.validated_data["enrolled_class"])
        try:
            session = create_session(
                actor=self.request.user,
                enrolled_class=enrolled_class,
                session_date=serializer.validated_data["session_date"],
                topic=serializer.validated_data.get("topic", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = session


@extend_schema_view(
    get=extend_schema(summary="Retrieve Attendance Session", tags=["Academic - Attendance"]),
    patch=extend_schema(summary="Update Attendance Session", tags=["Academic - Attendance"]),
)
class SessionDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [CanManageAttendance]
    lookup_field = "pk"
    serializer_class = AttendanceSessionSerializer
    throttle_scope = "academic_attendance"

    def get_object(self):
        return get_session_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        session = self.get_object()
        self.check_object_permissions(self.request, session)
        try:
            updated = update_session(
                self.request.user,
                session,
                session_date=serializer.validated_data.get("session_date"),
                topic=serializer.validated_data.get("topic"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(summary="Bulk Record Attendance", tags=["Academic - Attendance"]),
)
class SessionRecordBulkView(generics.GenericAPIView):
    permission_classes = [CanManageAttendance]
    serializer_class = AttendanceRecordBulkSerializer
    throttle_scope = "academic_attendance"

    def post(self, request, pk):
        session = get_session_or_404(pk)
        self.check_object_permissions(request, session)

        data = request.data
        if not isinstance(data, list):
            data = [data]

        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            records = bulk_record_attendance(
                request.user, session=session, records=serializer.validated_data
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        result_serializer = AttendanceRecordSerializer(records, many=True)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    patch=extend_schema(summary="Update Attendance Record", tags=["Academic - Attendance"]),
)
class RecordDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [CanManageAttendance]
    serializer_class = AttendanceRecordSerializer
    throttle_scope = "academic_attendance"

    def get_object(self):
        return get_object_or_404(
            AttendanceRecord.objects.select_related(
                "attendance_session__enrolled_class",
                "enrollment__student__user",
            ),
            pk=self.kwargs["record_pk"],
        )

    def perform_update(self, serializer):
        record = self.get_object()
        self.check_object_permissions(self.request, record)
        try:
            updated = update_attendance_record(
                self.request.user,
                record,
                status=serializer.validated_data.get("status"),
                remarks=serializer.validated_data.get("remarks"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated


@extend_schema_view(
    get=extend_schema(summary="Enrollment Attendance History", tags=["Academic - Attendance"]),
)
class EnrollmentAttendanceHistoryView(generics.GenericAPIView):
    permission_classes = [CanManageAttendance]
    serializer_class = AttendanceRecordSerializer
    throttle_scope = "academic_attendance"

    def get(self, request, enrollment_pk):
        enrollment = get_object_or_404(Enrollment, pk=enrollment_pk)
        records = get_enrollment_attendance_history(enrollment)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(summary="Enrollment Attendance Summary", tags=["Academic - Attendance"]),
)
class EnrollmentAttendanceSummaryView(generics.GenericAPIView):
    permission_classes = [CanManageAttendance]
    serializer_class = AttendanceSummarySerializer
    throttle_scope = "academic_attendance"

    def get(self, request, enrollment_pk):
        enrollment = get_object_or_404(Enrollment, pk=enrollment_pk)
        summary = get_attendance_summary(enrollment)
        serializer = self.get_serializer(summary)
        return Response(serializer.data, status=status.HTTP_200_OK)
