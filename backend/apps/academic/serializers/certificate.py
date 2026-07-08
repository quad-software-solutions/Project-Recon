from rest_framework import serializers

from apps.academic.models import Certificate, StudentCertificate


class CertificateSerializer(serializers.ModelSerializer):
    sub_program = serializers.UUIDField(required=True)
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )

    class Meta:
        model = Certificate
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "title",
            "background",
            "institute_logo",
            "signature",
            "body_text",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "is_active", "created_at", "updated_at",
            "sub_program_name",
        ]
        extra_kwargs = {
            "background": {"write_only": True},
            "institute_logo": {"write_only": True},
            "signature": {"write_only": True},
        }


class CertificateListSerializer(serializers.ModelSerializer):
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    background_url = serializers.SerializerMethodField()
    institute_logo_url = serializers.SerializerMethodField()
    signature_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "sub_program",
            "sub_program_name",
            "title",
            "background_url",
            "institute_logo_url",
            "signature_url",
            "body_text",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_background_url(self, obj):
        if obj.background:
            return obj.background.url
        return None

    def get_institute_logo_url(self, obj):
        if obj.institute_logo:
            return obj.institute_logo.url
        return None

    def get_signature_url(self, obj):
        if obj.signature:
            return obj.signature.url
        return None


class IssueCertificateSerializer(serializers.Serializer):
    student = serializers.UUIDField(required=True)
    certificate = serializers.UUIDField(required=True)


class StudentCertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    certificate_title = serializers.CharField(
        source="certificate.title", read_only=True
    )
    issued_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentCertificate
        fields = [
            "id",
            "student",
            "student_name",
            "certificate",
            "certificate_title",
            "sub_program",
            "sub_program_name",
            "certificate_number",
            "issued_by",
            "issued_by_name",
            "issued_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_student_name(self, obj):
        return obj.student.user.full_name

    def get_issued_by_name(self, obj):
        return obj.issued_by.full_name


class StudentCertificateListSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    certificate_title = serializers.CharField(
        source="certificate.title", read_only=True
    )

    class Meta:
        model = StudentCertificate
        fields = [
            "id",
            "student_name",
            "certificate_title",
            "sub_program_name",
            "certificate_number",
            "issued_at",
        ]
        read_only_fields = fields

    def get_student_name(self, obj):
        return obj.student.user.full_name


class PublicCertificateVerifySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    sub_program_name = serializers.CharField(
        source="sub_program.name", read_only=True
    )
    certificate_title = serializers.CharField(
        source="certificate.title", read_only=True
    )
    issued_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentCertificate
        fields = [
            "certificate_number",
            "student_name",
            "sub_program_name",
            "certificate_title",
            "issued_at",
            "issued_by_name",
        ]
        read_only_fields = fields

    def get_student_name(self, obj):
        return obj.student.user.full_name

    def get_issued_by_name(self, obj):
        return obj.issued_by.full_name
