from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.academic.constants import ProgressStatus as ProgressStatusChoice
from apps.academic.models import LearningMilestone, StudentProgress, Enrollment
from apps.academic.models.sub_program import SubProgram
from apps.academic.models.class_model import Class as ClassModel
from apps.academic.permissions.progress import CanManageProgress
from apps.academic.serializers import (
    LearningMilestoneSerializer,
    LearningMilestoneListSerializer,
    CustomizeMilestoneSerializer,
    StudentProgressSerializer,
    RecordProgressSerializer,
    UpdateProgressSerializer,
    ProgressSummarySerializer,
)
from apps.academic.services.progress_service import (
    get_milestone_or_404,
    list_milestones,
    create_milestone,
    update_milestone,
    archive_milestone,
    customize_milestone,
    record_progress,
    update_progress,
    get_progress_history,
    get_progress_summary,
)


@extend_schema_view(
    get=extend_schema(summary="List Learning Milestones", tags=["Academic - Learning Progress"]),
    post=extend_schema(summary="Create Learning Milestone", tags=["Academic - Learning Progress"]),
)
class MilestoneListCreateView(generics.ListCreateAPIView):
    permission_classes = [CanManageProgress]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return LearningMilestoneListSerializer
        return LearningMilestoneSerializer

    def get_queryset(self):
        return list_milestones(
            sub_program=self.request.query_params.get("sub_program"),
            scope_class=self.request.query_params.get("scope_class"),
        )

    def perform_create(self, serializer):
        sub_program = get_object_or_404(
            SubProgram, pk=serializer.validated_data["sub_program"]
        )
        scope_class = None
        scope_class_id = serializer.validated_data.get("scope_class")
        if scope_class_id:
            scope_class = get_object_or_404(ClassModel, pk=scope_class_id)
        try:
            milestone = create_milestone(
                actor=self.request.user,
                sub_program=sub_program,
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                scope_class=scope_class,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = milestone


@extend_schema_view(
    get=extend_schema(summary="Retrieve Learning Milestone", tags=["Academic - Learning Progress"]),
    patch=extend_schema(summary="Update Learning Milestone", tags=["Academic - Learning Progress"]),
)
class MilestoneRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [CanManageProgress]
    lookup_field = "pk"
    serializer_class = LearningMilestoneSerializer

    def get_object(self):
        return get_milestone_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        milestone = self.get_object()
        self.check_object_permissions(self.request, milestone)
        try:
            updated = update_milestone(
                self.request.user,
                milestone,
                title=serializer.validated_data.get("title"),
                description=serializer.validated_data.get("description"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(summary="Archive Learning Milestone", tags=["Academic - Learning Progress"]),
)
class MilestoneArchiveView(generics.GenericAPIView):
    permission_classes = [CanManageProgress]

    def post(self, request, pk):
        milestone = get_milestone_or_404(pk)
        self.check_object_permissions(request, milestone)
        try:
            archived = archive_milestone(request.user, milestone)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer = LearningMilestoneSerializer(archived)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Customize Shared Milestone for a Class", tags=["Academic - Learning Progress"]),
)
class MilestoneCustomizeView(generics.GenericAPIView):
    permission_classes = [CanManageProgress]
    serializer_class = CustomizeMilestoneSerializer

    def post(self, request, pk):
        source_milestone = get_milestone_or_404(pk)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_class = get_object_or_404(
            ClassModel, pk=serializer.validated_data["target_class"]
        )
        try:
            customized = customize_milestone(
                request.user, source_milestone, target_class
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        result_serializer = LearningMilestoneSerializer(customized)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    post=extend_schema(summary="Record Student Progress", tags=["Academic - Learning Progress"]),
)
class RecordProgressView(generics.GenericAPIView):
    permission_classes = [CanManageProgress]
    serializer_class = RecordProgressSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment = get_object_or_404(Enrollment, pk=serializer.validated_data["enrollment"])
        milestone = get_milestone_or_404(serializer.validated_data["milestone"])
        try:
            record = record_progress(
                actor=request.user,
                enrollment=enrollment,
                milestone=milestone,
                status=serializer.validated_data.get("status", ProgressStatusChoice.NOT_STARTED),
                remarks=serializer.validated_data.get("remarks", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        result_serializer = StudentProgressSerializer(record)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    patch=extend_schema(summary="Update Student Progress", tags=["Academic - Learning Progress"]),
)
class UpdateProgressView(generics.RetrieveUpdateAPIView):
    permission_classes = [CanManageProgress]
    lookup_field = "pk"
    serializer_class = StudentProgressSerializer

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UpdateProgressSerializer
        return StudentProgressSerializer

    def get_object(self):
        return get_object_or_404(
            StudentProgress.objects.select_related(
                "enrollment__student__user",
                "milestone",
                "updated_by",
            ),
            pk=self.kwargs["pk"],
        )

    def patch(self, request, pk):
        record = self.get_object()
        self.check_object_permissions(request, record)
        serializer = UpdateProgressSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            updated = update_progress(
                request.user,
                record,
                status=serializer.validated_data.get("status"),
                remarks=serializer.validated_data.get("remarks"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        result_serializer = StudentProgressSerializer(updated)
        return Response(result_serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(summary="Enrollment Progress History", tags=["Academic - Learning Progress"]),
)
class ProgressHistoryView(generics.GenericAPIView):
    permission_classes = [CanManageProgress]
    serializer_class = StudentProgressSerializer

    def get(self, request, enrollment_pk):
        enrollment = get_object_or_404(Enrollment, pk=enrollment_pk)
        records = get_progress_history(enrollment)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(summary="Enrollment Progress Summary", tags=["Academic - Learning Progress"]),
)
class ProgressSummaryView(generics.GenericAPIView):
    permission_classes = [CanManageProgress]
    serializer_class = ProgressSummarySerializer

    def get(self, request, enrollment_pk):
        enrollment = get_object_or_404(Enrollment, pk=enrollment_pk)
        summary = get_progress_summary(enrollment)
        serializer = self.get_serializer(summary)
        return Response(serializer.data, status=status.HTTP_200_OK)
