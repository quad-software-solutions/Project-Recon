from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.response import Response

from apps.academic.models import Class
from apps.academic.permissions import IsAcademicAdmin
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

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ClassListSerializer
        return ClassSerializer

    def get_queryset(self):
        return list_classes()

    def perform_create(self, serializer):
        instance = create_class(**serializer.validated_data)
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

    def get_object(self):
        return get_class_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        klass = self.get_object()
        updated = update_class(klass, **serializer.validated_data)
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

    def post(self, request, pk):
        klass = get_class_or_404(pk)
        serializer = AssignInstructorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.accounts.models import User

        instructor = User.objects.get(pk=serializer.validated_data["instructor"])
        assign_instructor(klass, instructor)
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

    def post(self, request, pk):
        klass = get_class_or_404(pk)
        activate_class(klass)
        return Response(ClassSerializer(klass).data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Deactivate Class", tags=["Academic - Classes"]),
)
class ClassDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = ClassSerializer

    def post(self, request, pk):
        klass = get_class_or_404(pk)
        deactivate_class(klass)
        return Response(ClassSerializer(klass).data, status=status.HTTP_200_OK)
