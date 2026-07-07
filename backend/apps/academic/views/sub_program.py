from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.academic.permissions import IsAcademicAdmin
from apps.academic.serializers import SubProgramListSerializer, SubProgramSerializer
from apps.academic.services.program_service import (
    list_sub_programs,
    create_sub_program,
    get_sub_program_or_404,
    update_sub_program,
    activate_sub_program,
    deactivate_sub_program,
)


@extend_schema_view(
    get=extend_schema(summary="List Sub Programs", tags=["Academic - Sub Programs"]),
    post=extend_schema(summary="Create Sub Program", tags=["Academic - Sub Programs"]),
)
class SubProgramListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "GET":
            return SubProgramListSerializer
        return SubProgramSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAcademicAdmin()]

    def get_queryset(self):
        return list_sub_programs()

    def perform_create(self, serializer):
        instance = create_sub_program(**serializer.validated_data)
        serializer.instance = instance


@extend_schema_view(
    get=extend_schema(summary="Retrieve Sub Program", tags=["Academic - Sub Programs"]),
    put=extend_schema(summary="Update Sub Program", tags=["Academic - Sub Programs"]),
    patch=extend_schema(summary="Partial Update Sub Program", tags=["Academic - Sub Programs"]),
)
class SubProgramRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = SubProgramSerializer
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAcademicAdmin()]

    def get_object(self):
        return get_sub_program_or_404(self.kwargs["pk"])

    def perform_update(self, serializer):
        sub_program = self.get_object()
        updated = update_sub_program(sub_program, **serializer.validated_data)
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(summary="Activate Sub Program", tags=["Academic - Sub Programs"]),
)
class SubProgramActivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = SubProgramSerializer

    def post(self, request, pk):
        sub_program = get_sub_program_or_404(pk)
        activate_sub_program(sub_program)
        return Response(SubProgramSerializer(sub_program).data, status=status.HTTP_200_OK)


@extend_schema_view(
    post=extend_schema(summary="Deactivate Sub Program", tags=["Academic - Sub Programs"]),
)
class SubProgramDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicAdmin]
    serializer_class = SubProgramSerializer

    def post(self, request, pk):
        sub_program = get_sub_program_or_404(pk)
        deactivate_sub_program(sub_program)
        return Response(SubProgramSerializer(sub_program).data, status=status.HTTP_200_OK)
