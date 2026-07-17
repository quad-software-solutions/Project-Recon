from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView


class EnrollmentPagination(PageNumberPagination):
    page_size = 20

from apps.academic.constants import ClassType
from apps.academic.models import Student
from apps.academic.models.class_model import Class as ClassModel
from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    EnrollmentSerializer,
    EnrollmentListSerializer,
    EnrollStudentSerializer,
    OnlineEnrollmentSerializer,
)
from apps.academic.services.class_service import (
    get_active_class_or_404,
    resolve_class_for_enrollment,
)
from apps.academic.services.enrollment_service import (
    enroll_student,
    online_enrollment,
    cancel_enrollment,
    complete_enrollment,
    list_enrollments,
    get_enrollment_or_404,
)
from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin
from apps.accounts.services.branch_service import list_available_branches_for_enrollment


@extend_schema_view(
    get=extend_schema(summary="List Enrollments", tags=["Academic - Enrollment"]),
    post=extend_schema(summary="Enroll Student (Staff)", tags=["Academic - Enrollment"]),
)
class EnrollmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAcademicStaff]
    pagination_class = EnrollmentPagination

    def get_serializer_class(self):
        if self.request.method == "GET":
            return EnrollmentListSerializer
        return EnrollStudentSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "student__user__first_name",
        "student__user__last_name",
        "student__user__email",
        "enrolled_class__name",
    ]
    ordering_fields = ["enrolled_at", "status"]
    ordering = ["-enrolled_at"]

    def get_queryset(self):
        branch_ids = None
        if not user_is_super_admin(self.request.user):
            branch_ids = get_active_branch_ids(self.request.user)
        return list_enrollments(branch_ids=branch_ids)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        student = get_object_or_404(Student, pk=data.pop("student"))
        enrolled_class = get_object_or_404(ClassModel, pk=data.pop("enrolled_class"))
        try:
            enrollment = enroll_student(
                request.user,
                student=student,
                enrolled_class=enrolled_class,
                **data,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    post=extend_schema(summary="Cancel Enrollment", tags=["Academic - Enrollment"]),
)
class EnrollmentCancelView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentSerializer

    def post(self, request, pk):
        enrollment = get_enrollment_or_404(pk)
        try:
            cancel_enrollment(request.user, enrollment)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Complete Enrollment", tags=["Academic - Enrollment"]),
)
class EnrollmentCompleteView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentSerializer

    def post(self, request, pk):
        enrollment = get_enrollment_or_404(pk)
        try:
            complete_enrollment(request.user, enrollment)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(
        summary="Available Branches for Enrollment",
        description="Return active branches that have an active class for the given sub-program and class type.",
        tags=["Academic - Enrollment"],
        parameters=[
            {"name": "sub_program", "in": "query", "required": True, "schema": {"type": "string", "format": "uuid"}},
            {"name": "class_type", "in": "query", "required": True, "schema": {"type": "string", "enum": ["GROUP", "INDIVIDUAL"]}},
        ],
    ),
)
class AvailableBranchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        sub_program = request.query_params.get("sub_program")
        class_type = request.query_params.get("class_type")
        if not sub_program or not class_type:
            return Response(
                {"error": "sub_program and class_type are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if class_type not in ClassType.values:
            return Response(
                {"error": "Invalid class_type."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        branches = list_available_branches_for_enrollment(
            sub_program_id=sub_program, class_type=class_type,
        )
        return Response(list(branches))


@extend_schema_view(
    post=extend_schema(summary="Online Enrollment (Self-Service)", tags=["Academic - Enrollment"]),
)
class OnlineEnrollmentView(generics.GenericAPIView):
    serializer_class = OnlineEnrollmentSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        if data.get("enrolled_class"):
            klass = get_active_class_or_404(data.pop("enrolled_class"))
        else:
            klass = resolve_class_for_enrollment(
                sub_program_id=data.pop("sub_program"),
                class_type=data.pop("class_type"),
                branch_id=data.pop("branch"),
            )
            if not klass:
                raise ValidationError("No active class found for the selected options.")

        try:
            enrollment = online_enrollment(
                user=request.user if request.user.is_authenticated else None,
                enrolled_class=klass,
                **data,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )
