import os
from io import BytesIO

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import transaction
from django.shortcuts import get_object_or_404
from PIL import Image

from apps.academic.constants import MaterialType
from apps.academic.models import LearningMaterial
from apps.shared.audit.services import log_action
from apps.shared.validators import MAGIC_MIME_MAP, sanitize_filename, validate_uploaded_file


def _detect_material_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        ".jpg": MaterialType.IMAGE, ".jpeg": MaterialType.IMAGE,
        ".png": MaterialType.IMAGE, ".gif": MaterialType.IMAGE,
        ".webp": MaterialType.IMAGE,
        ".pdf": MaterialType.PDF,
        ".ppt": MaterialType.PPT,
        ".pptx": MaterialType.PPTX,
        ".doc": MaterialType.DOC,
        ".docx": MaterialType.DOCX,
    }
    try:
        return mapping[ext]
    except KeyError:
        raise DjangoValidationError(
            f"Unsupported file extension '{ext}'. "
            f"Allowed: {', '.join(sorted(mapping))}."
        )


_IMAGE_EXTS = frozenset({".jpg", ".jpeg", ".png", ".gif", ".webp"})
_MAX_IMAGE_DIMENSION = 8000


def _reencode_image(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in _IMAGE_EXTS:
        return file

    file.seek(0)
    try:
        img = Image.open(file)
        img.load()
    except Exception as exc:
        raise DjangoValidationError(
            f"Unable to process image: {exc}"
        )

    if img.width > _MAX_IMAGE_DIMENSION or img.height > _MAX_IMAGE_DIMENSION:
        raise DjangoValidationError(
            f"Image dimensions ({img.width}x{img.height}) exceed "
            f"the maximum allowed ({_MAX_IMAGE_DIMENSION}x{_MAX_IMAGE_DIMENSION})."
        )

    output = BytesIO()
    try:
        if ext in (".jpg", ".jpeg"):
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")
            img.save(output, format="JPEG", quality=90)
        elif ext == ".png":
            if img.mode == "P":
                img = img.convert("RGBA")
            img.save(output, format="PNG")
        elif ext == ".gif":
            img.save(output, format="GIF", save_all=True)
        elif ext == ".webp":
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
            img.save(output, format="WebP", quality=90)
    except Exception as exc:
        raise DjangoValidationError(
            f"Failed to re-encode image: {exc}"
        )

    output.seek(0)
    mime = next(iter(MAGIC_MIME_MAP.get(ext, {})), None)
    return InMemoryUploadedFile(
        output, "file", sanitize_filename(file.name),
        mime or "application/octet-stream", output.tell(), None,
    )


def _validate_instructor_teaches_sub_program(actor, sub_program):
    from apps.accounts.permissions.roles import (
        user_is_branch_manager,
        user_is_super_admin,
    )
    if user_is_super_admin(actor) or user_is_branch_manager(actor):
        return
    from apps.academic.models import Class
    owns_class = Class.objects.filter(
        instructor=actor, sub_program=sub_program, is_active=True,
    ).exists()
    if not owns_class:
        raise DjangoValidationError(
            "You can only upload materials to SubPrograms you teach."
        )


def _validate_owner_access(actor, material):
    from apps.accounts.permissions.roles import (
        user_is_branch_manager,
        user_is_super_admin,
    )
    if user_is_super_admin(actor) or user_is_branch_manager(actor):
        return
    if material.uploaded_by != actor:
        raise DjangoValidationError(
            "You can only modify materials you uploaded."
        )


def upload_material(actor, *, sub_program, title, file, description=""):
    _validate_instructor_teaches_sub_program(actor, sub_program)
    validate_uploaded_file(file)
    file = _reencode_image(file)

    material_type = _detect_material_type(file.name)

    material = LearningMaterial(
        sub_program=sub_program,
        title=title,
        description=description,
        file=file,
        material_type=material_type,
        uploaded_by=actor,
    )
    material.full_clean()
    material.save()

    log_action(
        actor=actor,
        action="LEARNING_MATERIAL_UPLOADED",
        resource_type="LearningMaterial",
        resource_id=str(material.id),
    )
    return material


@transaction.atomic
def update_material(actor, material, *, title=None, description=None, file=None):
    _validate_owner_access(actor, material)

    if file is not None:
        validate_uploaded_file(file)
        file = _reencode_image(file)
        if material.file:
            material.file.delete(save=False)
        material.file = file
        material.material_type = _detect_material_type(file.name)
    if title is not None:
        material.title = title
    if description is not None:
        material.description = description
    material.full_clean()
    material.save()

    log_action(
        actor=actor,
        action="LEARNING_MATERIAL_UPDATED",
        resource_type="LearningMaterial",
        resource_id=str(material.id),
    )
    return material


def delete_material(actor, material):
    _validate_owner_access(actor, material)

    material.is_active = False
    material.save(update_fields=["is_active", "updated_at"])

    log_action(
        actor=actor,
        action="LEARNING_MATERIAL_DELETED",
        resource_type="LearningMaterial",
        resource_id=str(material.id),
    )
    return material


def get_material_or_404(pk):
    return get_object_or_404(
        LearningMaterial.objects.select_related(
            "sub_program__program", "uploaded_by",
        ),
        pk=pk, is_active=True,
    )


def list_materials(sub_program=None, uploaded_by=None):
    qs = LearningMaterial.objects.select_related(
        "sub_program__program", "uploaded_by",
    ).filter(is_active=True)
    if sub_program:
        qs = qs.filter(sub_program=sub_program)
    if uploaded_by:
        qs = qs.filter(uploaded_by=uploaded_by)
    return qs


def get_student_materials(student):
    from apps.academic.models import Enrollment
    sub_program_ids = Enrollment.objects.filter(
        student=student, status__in=["ACTIVE", "COMPLETED"],
    ).values_list("enrolled_class__sub_program", flat=True).distinct()
    return LearningMaterial.objects.filter(
        sub_program_id__in=sub_program_ids, is_active=True,
    ).select_related("sub_program__program", "uploaded_by")
