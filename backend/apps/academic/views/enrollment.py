from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnrollmentPagination(PageNumberPagination):
    page_size = 20

from apps.academic.models import Student
from apps.academic.models.class_model import Class as ClassModel
from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    EnrollmentSerializer,
    EnrollmentListSerializer,
    EnrollStudentSerializer,
    OnlineEnrollmentSerializer,
)
from apps.academic.services.enrollment_service import (
    enroll_student,
    online_enrollment,
    cancel_enrollment,
    complete_enrollment,
    list_enrollments,
    get_enrollment_or_404,
)


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
        return list_enrollments()

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
    post=extend_schema(summary="Online Enrollment (Self-Service)", tags=["Academic - Enrollment"]),
)
class OnlineEnrollmentView(generics.GenericAPIView):
    serializer_class = OnlineEnrollmentSerializer
    permission_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        enrolled_class = get_object_or_404(
            ClassModel.objects.select_related("sub_program__program", "branch"),
            pk=data.pop("enrolled_class"),
        )
        callback_url = data.pop("callback_url")
        return_url = data.pop("return_url", None)

        try:
            enrollment, checkout_url = online_enrollment(
                user=request.user if request.user.is_authenticated else None,
                enrolled_class=enrolled_class,
                callback_url=callback_url,
                return_url=return_url,
                **data,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            {
                "enrollment": EnrollmentSerializer(enrollment).data,
                "checkout_url": checkout_url,
            },
            status=status.HTTP_201_CREATED,
        )
