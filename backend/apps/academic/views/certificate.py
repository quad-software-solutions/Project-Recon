from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import Certificate, Student, StudentCertificate
from apps.academic.permissions.certificate import (
    CanManageCertificate,
    CanViewCertificate,
)
from apps.academic.serializers import (
    CertificateListSerializer,
    CertificateSerializer,
    IssueCertificateSerializer,
    PublicCertificateVerifySerializer,
    StudentCertificateListSerializer,
    StudentCertificateSerializer,
)
from apps.academic.services.certificate_service import (
    activate_certificate,
    create_certificate,
    deactivate_certificate,
    get_certificate_template_or_404,
    get_student_certificate_by_number,
    get_student_certificate_or_404,
    get_student_certificates,
    issue_certificate,
    list_certificate_templates,
    update_certificate,
)


@extend_schema_view(
    get=extend_schema(summary="List Certificate Templates", tags=["Academic - Certificates"]),
    post=extend_schema(summary="Create Certificate Template", tags=["Academic - Certificates"]),
)
class CertificateTemplateListCreateView(generics.ListCreateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, CanManageCertificate]
    throttle_scope = "academic_staff"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return CertificateListSerializer
        return CertificateSerializer

    def get_queryset(self):
        from uuid import UUID

        sub_program = self.request.query_params.get("sub_program")
        if sub_program:
            try:
                UUID(sub_program)
            except ValueError:
                raise ValidationError("Invalid sub_program UUID.")

        return list_certificate_templates(
            sub_program=sub_program,
            active_only=False,
        )

    def perform_create(self, serializer):
        sub_program = get_object_or_404(
            Certificate._meta.get_field("sub_program").related_model,
            pk=serializer.validated_data["sub_program"],
        )
        try:
            cert = create_certificate(
                actor=self.request.user,
                sub_program=sub_program,
                title=serializer.validated_data["title"],
                background=serializer.validated_data["background"],
                body_text=serializer.validated_data.get("body_text", ""),
                institute_logo=serializer.validated_data.get("institute_logo"),
                signature=serializer.validated_data.get("signature"),
            )
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = cert


@extend_schema_view(
    get=extend_schema(summary="Retrieve Certificate Template", tags=["Academic - Certificates"]),
    patch=extend_schema(summary="Update Certificate Template", tags=["Academic - Certificates"]),
)
class CertificateTemplateRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, CanManageCertificate]
    lookup_field = "pk"
    serializer_class = CertificateSerializer
    throttle_scope = "academic_staff"

    def get_object(self):
        obj = get_certificate_template_or_404(self.kwargs["pk"])
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_update(self, serializer):
        cert = self.get_object()
        self.check_object_permissions(self.request, cert)
        try:
            validated = serializer.validated_data
            updated = update_certificate(
                self.request.user,
                cert,
                title=validated.get("title"),
                body_text=validated.get("body_text"),
                background=validated.get("background"),
                institute_logo=validated.get("institute_logo"),
                signature=validated.get("signature"),
            )
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer.instance = updated


@extend_schema_view(
    post=extend_schema(
        summary="Activate Certificate Template",
        tags=["Academic - Certificates"],
    ),
)
class CertificateTemplateActivateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanManageCertificate]
    throttle_scope = "academic_staff"

    def post(self, request, pk):
        cert = get_certificate_template_or_404(pk)
        self.check_object_permissions(request, cert)
        try:
            activated = activate_certificate(request.user, cert)
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer = CertificateSerializer(activated)
        return Response(serializer.data)


@extend_schema_view(
    post=extend_schema(
        summary="Deactivate Certificate Template",
        tags=["Academic - Certificates"],
    ),
)
class CertificateTemplateDeactivateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanManageCertificate]
    throttle_scope = "academic_staff"

    def post(self, request, pk):
        cert = get_certificate_template_or_404(pk)
        self.check_object_permissions(request, cert)
        try:
            deactivated = deactivate_certificate(request.user, cert)
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))
        serializer = CertificateSerializer(deactivated)
        return Response(serializer.data)


@extend_schema_view(
    post=extend_schema(
        summary="Issue Certificate to Student",
        tags=["Academic - Certificates"],
    ),
)
class StudentCertificateIssueView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanManageCertificate]
    serializer_class = IssueCertificateSerializer
    throttle_scope = "academic_staff"

    def post(self, request):
        serializer = IssueCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = get_object_or_404(
            Student, pk=serializer.validated_data["student"],
        )
        certificate = get_certificate_template_or_404(
            serializer.validated_data["certificate"],
        )
        self.check_object_permissions(request, certificate)

        try:
            sc, warnings = issue_certificate(
                actor=request.user,
                student=student,
                certificate=certificate,
            )
        except DjangoValidationError as exc:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(exc.message if hasattr(exc, 'message') else str(exc))

        out = StudentCertificateSerializer(sc)
        data = out.data
        if warnings:
            data["warnings"] = warnings
        return Response(data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(
        summary="List Student Certificates",
        tags=["Academic - Certificates"],
    ),
)
class StudentCertificateListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanViewCertificate]
    serializer_class = StudentCertificateListSerializer
    throttle_scope = "academic_staff"

    def get(self, request):
        from apps.accounts.permissions.roles import user_is_student

        if user_is_student(request.user):
            student = get_object_or_404(Student, user=request.user)
            qs = get_student_certificates(student=student)
        else:
            branch_ids = None
            if not request.user.is_superuser:
                from apps.accounts.permissions.roles import get_active_branch_ids, user_is_super_admin
                if not user_is_super_admin(request.user):
                    branch_ids = get_active_branch_ids(request.user)
            
            student_pk = request.query_params.get("student")
            if student_pk:
                student = get_object_or_404(Student, pk=student_pk)
                qs = get_student_certificates(student=student, branch_ids=branch_ids)
            else:
                qs = get_student_certificates(branch_ids=branch_ids)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


@extend_schema_view(
    get=extend_schema(
        summary="Retrieve Student Certificate",
        tags=["Academic - Certificates"],
    ),
)
class StudentCertificateRetrieveView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanViewCertificate]
    serializer_class = StudentCertificateSerializer
    throttle_scope = "academic_staff"

    def get(self, request, pk):
        sc = get_student_certificate_or_404(pk)
        self.check_object_permissions(request, sc)
        serializer = self.get_serializer(sc)
        return Response(serializer.data)


@extend_schema_view(
    get=extend_schema(
        summary="Verify Certificate (Public)",
        description="Public endpoint to verify a certificate by its number. No authentication required.",
        tags=["Academic - Certificates"],
    ),
)
class CertificatePublicVerifyView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicCertificateVerifySerializer
    throttle_scope = "academic_public"

    def get(self, request, number):
        try:
            sc = get_student_certificate_by_number(number)
        except Http404:
            return Response({"valid": False}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "valid": True,
            "student_name": sc.student.user.full_name,
            "certificate_number": sc.certificate_number,
            "sub_program_name": sc.sub_program.name,
            "certificate_title": sc.certificate.title,
            "issued_at": sc.issued_at,
        })
