import os

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import LearningMaterial
from apps.academic.models.sub_program import SubProgram
from apps.academic.permissions.learning_material import (
    CanManageMaterial,
    CanViewMaterial,
)
from apps.academic.serializers import (
    LearningMaterialSerializer,
    LearningMaterialListSerializer,
)
from apps.academic.services.learning_material_service import (
    delete_material,
    get_material_or_404,
    get_student_materials,
    list_materials,
    update_material,
    upload_material,
)


@extend_schema_view(
    get=extend_schema(summary="List Learning Materials", tags=["Academic - Learning Materials"]),
    post=extend_schema(summary="Upload Learning Material", tags=["Academic - Learning Materials"]),
)
class MaterialListCreateView(generics.ListCreateAPIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), CanViewMaterial()]
        return [IsAuthenticated(), CanManageMaterial()]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return LearningMaterialListSerializer
        return LearningMaterialSerializer

    def get_queryset(self):
        user = self.request.user
        from apps.accounts.permissions.roles import user_is_student

        if user_is_student(user):
            from apps.academic.models import Student
            try:
                student = Student.objects.get(user=user)
            except Student.DoesNotExist:
                return LearningMaterial.objects.none()
            return get_student_materials(student)

        return list_materials(
            sub_program=self.request.query_params.get("sub_program"),
            uploaded_by=self.request.query_params.get("uploaded_by"),
        )

    def perform_create(self, serializer):
        sub_program = get_object_or_404(
            SubProgram, pk=serializer.validated_data["sub_program"]
        )
        try:
            material = upload_material(
                actor=self.request.user,
                sub_program=sub_program,
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                file=serializer.validated_data["file"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = material


@extend_schema_view(
    get=extend_schema(summary="Retrieve Learning Material", tags=["Academic - Learning Materials"]),
    patch=extend_schema(summary="Update Learning Material", tags=["Academic - Learning Materials"]),
)
class MaterialRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = "pk"
    serializer_class = LearningMaterialSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), CanViewMaterial()]
        return [IsAuthenticated(), CanManageMaterial()]

    def get_object(self):
        obj = get_material_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_update(self, serializer):
        material = self.get_object()
        self.check_object_permissions(self.request, material)
        try:
            validated = serializer.validated_data
            updated = update_material(
                self.request.user,
                material,
                title=validated.get("title"),
                description=validated.get("description"),
                file=validated.get("file"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(summary="Delete Learning Material", tags=["Academic - Learning Materials"]),
)
class MaterialDeleteView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanManageMaterial]

    def post(self, request, pk):
        material = get_material_or_404(pk)
        self.check_object_permissions(request, material)
        try:
            deleted = delete_material(request.user, material)
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer = LearningMaterialSerializer(deleted)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(summary="Download Learning Material", tags=["Academic - Learning Materials"]),
)
class MaterialDownloadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanViewMaterial]

    def get(self, request, pk):
        material = get_material_or_404(pk)
        self.check_object_permissions(request, material)

        if not material.file:
            return Response(
                {"detail": "File not found."}, status=status.HTTP_404_NOT_FOUND
            )

        file_path = material.file.path
        try:
            f = open(file_path, "rb")
        except FileNotFoundError:
            return Response(
                {"detail": "File not found on disk."}, status=status.HTTP_404_NOT_FOUND
            )

        response = FileResponse(
            f,
            as_attachment=True,
            filename=os.path.basename(material.file.name),
        )
        return response
