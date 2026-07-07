from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.academic.permissions import IsAcademicAdmin
from apps.academic.serializers import ProgramListSerializer, ProgramSerializer
from apps.academic.services.program_service import (
    list_programs,
    create_program,
    get_program_or_404,
    update_program,
    activate_program,
    deactivate_program,
)


@extend_schema_view(
    get=extend_schema(summary="List Programs", tags=["Academic - Programs"]),
    post=extend_schema(summary="Create Program", tags=["Academic - Programs"]),
)
class ProgramListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "GET":
            return ProgramListSerializer
        return ProgramSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAcademicAdmin()]

    def get_queryset(self):
        return list_programs()

    def perform_create(self, serializer):
        instance = create_program(**serializer.validated_data)
        serializer.instance = instance


@extend_schema_view(
    get=extend_schema(summary="Retrieve Program", tags=["Academic - Programs"]),
    put=extend_schema(summary="Update Program", tags=["Academic - Programs"]),
    patch=extend_schema(summary="Partial Update Program", tags=["Academic - Programs"]),
)
class ProgramRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProgramSerializer
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAcademicAdmin()]

    def get_object(self):
        return get_program_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        program = self.get_object()
        updated = update_program(program, **serializer.validated_data)
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(summary="Activate Program", tags=["Academic - Programs"]),
)
class ProgramActivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = ProgramSerializer

    def post(self, request, pk):
        program = get_program_or_404(pk)
        activate_program(program)
        return Response(ProgramSerializer(program).data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Deactivate Program", tags=["Academic - Programs"]),
)
class ProgramDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = ProgramSerializer

    def post(self, request, pk):
        program = get_program_or_404(pk)
        deactivate_program(program)
        return Response(ProgramSerializer(program).data, status=status.HTTP_200_OK)
