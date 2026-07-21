from drf_spectacular.utils import extend_schema, extend_schema_view
from django.shortcuts import get_object_or_404

from rest_framework import filters, generics, status
from rest_framework.response import Response

from apps.academic.models import Class
from apps.academic.permissions import IsAcademicAdmin
from apps.academic.permissions.mixins import check_branch_access
from apps.shared.audit.services import log_action
from apps.academic.serializers import (
    AssignInstructorSerializer,
    ClassListSerializer,
    ClassSerializer,
)
from apps.academic.services.class_service import (
    list_classes,
    create_class,
    get_class_or_404,
    update_class,
    activate_class,
    deactivate_class,
    assign_instructor,
)


@extend_schema_view(
    get=extend_schema(summary="List Classes", tags=["Academic - Classes"]),
    post=extend_schema(summary="Create Class", tags=["Academic - Classes"]),
)
class ClassListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAcademicAdmin]
    throttle_scope = "academic_admin"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ClassListSerializer
        return ClassSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "class_type", "is_active"]
    ordering = ["name"]

    def get_queryset(self):
        return list_classes()

    def perform_create(self, serializer):
        instance = create_class(**serializer.validated_data)
        log_action(
            actor=self.request.user,
            action="CLASS_CREATED",
            resource_type="Class",
            resource_id=str(instance.id),
        )
        serializer.instance = instance


@extend_schema_view(
    get=extend_schema(summary="Retrieve Class", tags=["Academic - Classes"]),
    put=extend_schema(summary="Update Class", tags=["Academic - Classes"]),
    patch=extend_schema(summary="Partial Update Class", tags=["Academic - Classes"]),
)
class ClassRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = ClassSerializer
    lookup_field = "pk"
    throttle_scope = "academic_admin"

    def get_object(self):
        obj = get_class_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_update(self, serializer):
        klass = self.get_object()
        updated = update_class(klass, **serializer.validated_data)
        log_action(
            actor=self.request.user,
            action="CLASS_UPDATED",
            resource_type="Class",
            resource_id=str(updated.id),
        )
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(
        summary="Assign Instructor to Class",
        request=AssignInstructorSerializer,
        tags=["Academic - Classes"],
    ),
)
class ClassAssignInstructorView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    throttle_scope = "academic_admin"

    def post(self, request, pk):
        klass = get_class_or_404(pk)
        check_branch_access(request.user, klass.branch_id)
        serializer = AssignInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.accounts.models import User

        instructor = get_object_or_404(User, pk=serializer.validated_data["instructor"])
        assign_instructor(klass, instructor)
        log_action(
            actor=request.user,
            action="CLASS_INSTRUCTOR_ASSIGNED",
            resource_type="Class",
            resource_id=str(klass.id),
            details={"instructor_id": str(instructor.id)},
        )
        return Response(
            {"detail": "Instructor assigned successfully."},
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(summary="Activate Class", tags=["Academic - Classes"]),
)
class ClassActivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = ClassSerializer
    throttle_scope = "academic_admin"

    def post(self, request, pk):
        klass = get_class_or_404(pk)
        check_branch_access(request.user, klass.branch_id)
        activate_class(klass)
        log_action(
            actor=request.user,
            action="CLASS_ACTIVATED",
            resource_type="Class",
            resource_id=str(klass.id),
        )
        return Response(ClassSerializer(klass).data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Deactivate Class", tags=["Academic - Classes"]),
)
class ClassDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = ClassSerializer
    throttle_scope = "academic_admin"

    def post(self, request, pk):
        klass = get_class_or_404(pk)
        check_branch_access(request.user, klass.branch_id)
        deactivate_class(klass)
        log_action(
            actor=request.user,
            action="CLASS_DEACTIVATED",
            resource_type="Class",
            resource_id=str(klass.id),
        )
        return Response(ClassSerializer(klass).data, status=status.HTTP_200_OK)
