from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.response import Response

from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    EnrollmentPeriodListSerializer,
    EnrollmentPeriodSerializer,
)
from apps.academic.services.enrollment_period_service import (
    list_enrollment_periods,
    create_enrollment_period,
    get_enrollment_period_or_404,
    update_enrollment_period,
    activate_enrollment_period,
    deactivate_enrollment_period,
)
from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin


@extend_schema_view(
    get=extend_schema(summary="List Enrollment Periods", tags=["Academic - Enrollment Periods"]),
    post=extend_schema(summary="Create Enrollment Period", tags=["Academic - Enrollment Periods"]),
)
class EnrollmentPeriodListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAcademicStaff]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return EnrollmentPeriodListSerializer
        return EnrollmentPeriodSerializer

    def get_queryset(self):
        branch_ids = None
        if not user_is_super_admin(self.request.user):
            branch_ids = get_active_branch_ids(self.request.user)
        return list_enrollment_periods(branch_ids=branch_ids)

    def perform_create(self, serializer):
        instance = create_enrollment_period(self.request.user, **serializer.validated_data)
        serializer.instance = instance


@extend_schema_view(
    get=extend_schema(summary="Retrieve Enrollment Period", tags=["Academic - Enrollment Periods"]),
    put=extend_schema(summary="Update Enrollment Period", tags=["Academic - Enrollment Periods"]),
    patch=extend_schema(summary="Partial Update Enrollment Period", tags=["Academic - Enrollment Periods"]),
)
class EnrollmentPeriodRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentPeriodSerializer
    lookup_field = "pk"

    def get_object(self):
        return get_enrollment_period_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        period = self.get_object()
        updated = update_enrollment_period(self.request.user, period, **serializer.validated_data)
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(summary="Activate Enrollment Period", tags=["Academic - Enrollment Periods"]),
)
class EnrollmentPeriodActivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentPeriodSerializer

    def post(self, request, pk):
        period = get_enrollment_period_or_404(pk)
        activate_enrollment_period(request.user, period)
        return Response(EnrollmentPeriodSerializer(period).data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Deactivate Enrollment Period", tags=["Academic - Enrollment Periods"]),
)
class EnrollmentPeriodDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = EnrollmentPeriodSerializer

    def post(self, request, pk):
        period = get_enrollment_period_or_404(pk)
        deactivate_enrollment_period(request.user, period)
        return Response(EnrollmentPeriodSerializer(period).data, status=status.HTTP_200_OK)
