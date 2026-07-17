from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.academic.models.class_model import Class as ClassModel
from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    EnrollmentSerializer,
    MoveEnrollmentSerializer,
    BulkMoveEnrollmentSerializer,
)
from apps.academic.services.class_service import get_active_class_or_404
from apps.academic.services.enrollment_service import (
    move_enrollment,
    bulk_move_enrollments,
    get_enrollment_or_404,
)


@extend_schema_view(
    post=extend_schema(
        summary="Move Enrollment to Another Class",
        tags=["Academic - Enrollment"],
        request=MoveEnrollmentSerializer,
    ),
)
class EnrollmentMoveView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = MoveEnrollmentSerializer

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            enrollment = get_enrollment_or_404(pk)
            target_class = get_active_class_or_404(serializer.validated_data["target_class"])
            moved = move_enrollment(
                request.user,
                enrollment=enrollment,
                target_class=target_class,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            EnrollmentSerializer(moved).data,
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(
        summary="Split Class — Bulk Move Enrollments",
        tags=["Academic - Classes"],
        request=BulkMoveEnrollmentSerializer,
    ),
)
class ClassSplitView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = BulkMoveEnrollmentSerializer

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            source_class = get_object_or_404(ClassModel, pk=pk)
            target_class = get_active_class_or_404(data["target_class"])
            moved_enrollments = bulk_move_enrollments(
                request.user,
                source_class=source_class,
                target_class=target_class,
                enrollment_ids=data.get("enrollment_ids"),
                count=data.get("count"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        return Response(
            EnrollmentSerializer(moved_enrollments, many=True).data,
            status=status.HTTP_200_OK,
        )
