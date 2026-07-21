from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.response import Response

from apps.academic.permissions import IsAcademicStaff
from apps.academic.permissions.mixins import check_branch_access
from apps.academic.serializers import AdmitStudentSerializer, StudentSerializer
from apps.academic.services.admission_service import (
    admit_student,
)
from django.shortcuts import get_object_or_404

from apps.accounts.models import Branch


@extend_schema_view(
    post=extend_schema(summary="Admit Student", tags=["Academic - Admission"]),
)
class AdmitStudentView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = AdmitStudentSerializer
    throttle_scope = "academic_staff"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        branch = get_object_or_404(Branch, pk=data.pop("branch"))
        check_branch_access(request.user, branch.id)

        student = admit_student(
            **data,
            branch=branch,
            assigned_by=request.user,
        )

        return Response(
            StudentSerializer(student).data,
            status=status.HTTP_201_CREATED,
        )
