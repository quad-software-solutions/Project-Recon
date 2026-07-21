from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.response import Response

from apps.academic.permissions import IsAcademicStaff
from apps.academic.serializers import (
    StudentListSerializer,
    StudentSearchSerializer,
    StudentSerializer,
    StudentUpdateSerializer,
)
from apps.academic.services.student_service import (
    get_student_or_404,
    update_student,
    list_students,
    search_students,
    activate_student,
    deactivate_student,
)
from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin


@extend_schema_view(
    get=extend_schema(summary="Retrieve Student Profile", tags=["Academic - Students"]),
    patch=extend_schema(summary="Update Student Profile", tags=["Academic - Students"]),
)
class StudentRetrieveUpdateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    throttle_scope = "academic_staff"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return StudentSerializer
        return StudentUpdateSerializer

    def get(self, request, pk):
        student = get_student_or_404(pk)
        self.check_object_permissions(request, student)
        return Response(StudentSerializer(student).data)

    def patch(self, request, pk):
        serializer = StudentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = get_student_or_404(pk)
        self.check_object_permissions(request, student)
        student = update_student(
            student, actor=request.user, **serializer.validated_data
        )
        return Response(StudentSerializer(student).data)


@extend_schema_view(
    get=extend_schema(summary="List All Students", tags=["Academic - Students"]),
)
class StudentListView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = StudentListSerializer
    throttle_scope = "academic_staff"

    def get(self, request):
        branch_ids = None
        if not user_is_super_admin(request.user):
            branch_ids = get_active_branch_ids(request.user)
        students = list_students(branch_ids=branch_ids)
        return Response(StudentListSerializer(students, many=True).data)


@extend_schema_view(
    get=extend_schema(summary="Search Students", tags=["Academic - Students"]),
)
class StudentSearchView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = StudentSearchSerializer
    throttle_scope = "academic_staff"

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query or len(query) < 3:
            return Response([])

        branch_ids = None
        if not user_is_super_admin(request.user):
            branch_ids = get_active_branch_ids(request.user)
        students = search_students(query, branch_ids=branch_ids)
        return Response(StudentSearchSerializer(students, many=True).data)


@extend_schema_view(
    post=extend_schema(summary="Activate Student", tags=["Academic - Students"]),
)
class StudentActivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = StudentSerializer
    throttle_scope = "academic_staff"

    def post(self, request, pk):
        student = get_student_or_404(pk)
        self.check_object_permissions(request, student)
        activate_student(student, actor=request.user)
        return Response(StudentSerializer(student).data)


@extend_schema_view(
    post=extend_schema(summary="Deactivate Student", tags=["Academic - Students"]),
)
class StudentDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAcademicStaff]
    serializer_class = StudentSerializer
    throttle_scope = "academic_staff"

    def post(self, request, pk):
        student = get_student_or_404(pk)
        self.check_object_permissions(request, student)
        deactivate_student(student, actor=request.user)
        return Response(StudentSerializer(student).data)
