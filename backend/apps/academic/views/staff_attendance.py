from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.academic.models import StaffAttendanceSession
from apps.academic.permissions.staff_attendance import IsAttendanceManager
from apps.academic.serializers import (
    StaffAttendanceSessionSerializer,
    StaffAttendanceSessionListSerializer,
    StaffAttendanceRecordSerializer,
    StaffAttendanceRecordUpsertSerializer,
    AvailableStaffSerializer,
    PublishSessionSerializer,
)
from apps.academic.services.staff_attendance_service import (
    create_session,
    get_session_or_404,
    list_sessions,
    update_session,
    publish_session,
    soft_delete_session,
    upsert_records,
    get_record_or_404,
    update_record,
    delete_record,
    list_available_staff,
)
from apps.accounts.permissions.roles import user_manages_branch


def _check_branch_access(user, branch_id):
    from apps.accounts.permissions.roles import user_is_super_admin

    if not user_is_super_admin(user) and not user_manages_branch(user, branch_id):
        raise PermissionDenied("You do not have access to this branch.")


# ─── Built-in branch resolution mixin ───


class BranchAccessMixin:
    """Provides get_branch_id for IsAttendanceManager permission."""

    def get_branch_id(self, request):
        if request.method == "GET" and "branch" in request.query_params:
            return request.query_params["branch"]
        if request.method in ("POST", "PATCH", "DELETE"):
            branch_id = request.data.get("branch")
            if branch_id:
                return branch_id
            if hasattr(self, "get_object"):
                obj = self.get_object()
                return str(obj.branch_id)
        return None


@extend_schema_view(
    get=extend_schema(summary="List Staff Attendance Sessions", tags=["Academic - Staff Attendance"]),
    post=extend_schema(summary="Create Staff Attendance Session", tags=["Academic - Staff Attendance"]),
)
class SessionListCreateView(BranchAccessMixin, generics.ListCreateAPIView):
    permission_classes = [IsAttendanceManager]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return StaffAttendanceSessionListSerializer
        return StaffAttendanceSessionSerializer

    def get_queryset(self):
        return list_sessions(
            branch=self.request.query_params.get("branch"),
            date_from=self.request.query_params.get("date_from"),
            date_to=self.request.query_params.get("date_to"),
            status=self.request.query_params.get("status"),
        )

    def perform_create(self, serializer):
        instance = create_session(
            branch=serializer.validated_data["branch"],
            date=serializer.validated_data["date"],
            created_by=self.request.user,
            notes=serializer.validated_data.get("notes", ""),
        )
        serializer.instance = instance


@extend_schema_view(
    get=extend_schema(summary="Retrieve Staff Attendance Session", tags=["Academic - Staff Attendance"]),
    patch=extend_schema(summary="Update Staff Attendance Session", tags=["Academic - Staff Attendance"]),
    delete=extend_schema(summary="Soft Delete Staff Attendance Session", tags=["Academic - Staff Attendance"]),
)
class SessionDetailView(BranchAccessMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAttendanceManager]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return StaffAttendanceSessionSerializer
        return StaffAttendanceSessionSerializer

    def get_object(self):
        return get_session_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        session = self.get_object()
        _check_branch_access(self.request.user, session.branch_id)
        try:
            updated = update_session(self.request.user, session, **serializer.validated_data)
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated

    def perform_destroy(self, instance):
        _check_branch_access(self.request.user, instance.branch_id)
        soft_delete_session(None, instance)


@extend_schema_view(
    get=extend_schema(summary="List Available Staff for Branch", tags=["Academic - Staff Attendance"]),
)
class AvailableStaffView(BranchAccessMixin, generics.GenericAPIView):
    permission_classes = [IsAttendanceManager]
    serializer_class = AvailableStaffSerializer

    def get(self, request):
        branch_id = request.query_params.get("branch")
        if not branch_id:
            return Response({"detail": "branch query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        from django.shortcuts import get_object_or_404
        from apps.accounts.models import Branch

        branch = get_object_or_404(Branch, pk=branch_id)
        _check_branch_access(request.user, branch)
        staff = list_available_staff(branch)
        serializer = AvailableStaffSerializer(staff, many=True)
        return Response(serializer.data)


@extend_schema_view(
    post=extend_schema(summary="Publish Staff Attendance Session", tags=["Academic - Staff Attendance"]),
)
class SessionPublishView(BranchAccessMixin, generics.GenericAPIView):
    permission_classes = [IsAttendanceManager]
    serializer_class = PublishSessionSerializer

    def post(self, request, pk):
        session = get_session_or_404(pk)
        _check_branch_access(request.user, session.branch_id)
        try:
            publish_session(request.user, session)
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.message if hasattr(exc, 'message') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            StaffAttendanceSessionSerializer(session).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(summary="Upsert Attendance Records", tags=["Academic - Staff Attendance"]),
)
class RecordUpsertView(BranchAccessMixin, generics.GenericAPIView):
    permission_classes = [IsAttendanceManager]
    serializer_class = StaffAttendanceRecordUpsertSerializer

    def post(self, request, pk):
        session = get_session_or_404(pk)
        _check_branch_access(request.user, session.branch_id)

        data = request.data
        if not isinstance(data, list):
            data = [data]

        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            records = upsert_records(request.user, session, serializer.validated_data)
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.message if hasattr(exc, 'message') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result_serializer = StaffAttendanceRecordSerializer(records, many=True)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    patch=extend_schema(summary="Update Attendance Record", tags=["Academic - Staff Attendance"]),
    delete=extend_schema(summary="Delete Attendance Record", tags=["Academic - Staff Attendance"]),
)
class RecordDetailView(BranchAccessMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAttendanceManager]

    def get_serializer_class(self):
        return StaffAttendanceRecordSerializer

    def get_object(self):
        return get_record_or_404(self.kwargs["record_pk"])

    def perform_update(self, serializer):
        record = self.get_object()
        _check_branch_access(self.request.user, record.session.branch_id)
        try:
            updated = update_record(self.request.user, record, **serializer.validated_data)
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated

    def perform_destroy(self, instance):
        _check_branch_access(self.request.user, instance.session.branch_id)
        try:
            delete_record(self.request.user, instance)
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
