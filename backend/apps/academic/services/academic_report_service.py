from collections import Counter
from datetime import date
from io import BytesIO

from django.conf import settings
from django.db.models import Count
from django.shortcuts import get_object_or_404

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
     NextPageTemplate,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from apps.academic.constants import AttendanceStatus, EnrollmentStatus, ProgressStatus
from apps.academic.models import (
    AttendanceRecord,
    AttendanceSession,
    Class,
    Enrollment,
    LearningMilestone,
    Program,
    Student,
    StudentCertificate,
    StudentProgress,
    SubProgram,
)

_INSTITUTE_NAME = getattr(settings, "REPORT_INSTITUTE_NAME", "Institute")


# ---------------------------------------------------------------------------
# Style helpers
# ---------------------------------------------------------------------------

def _section_style():
    return ParagraphStyle(
        "SectionTitle",
        fontSize=13,
        spaceBefore=16,
        spaceAfter=6,
        textColor=colors.HexColor("#1a237e"),
        fontName="Helvetica-Bold",
    )


def _subsection_style():
    return ParagraphStyle(
        "SubSectionTitle",
        fontSize=11,
        spaceBefore=10,
        spaceAfter=4,
        textColor=colors.HexColor("#333333"),
        fontName="Helvetica-Bold",
    )


def _body_style():
    return ParagraphStyle(
        "Body",
        fontSize=9,
        spaceAfter=4,
        leading=13,
        fontName="Helvetica",
    )


def _label_style():
    return ParagraphStyle(
        "Label",
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        fontName="Helvetica-Bold",
    )


def _value_style():
    return ParagraphStyle(
        "Value",
        fontSize=10,
        spaceAfter=2,
        fontName="Helvetica",
    )


# ---------------------------------------------------------------------------
# Table builder
# ---------------------------------------------------------------------------

def _make_table(data, headers, col_widths=None):
    table_data = [headers] + data
    t = Table(table_data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a237e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f5f5f5")],
                ),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


# ---------------------------------------------------------------------------
# PDF document template with header / footer
# ---------------------------------------------------------------------------

class _ReportDocTemplate(BaseDocTemplate):
    def __init__(self, buffer, title, pagesize=A4, **kwargs):
        self._report_title = title
        self._report_date = date.today()
        super().__init__(buffer, pagesize=pagesize, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        self.addPageTemplates(
            [PageTemplate(id="main", frames=frame, onPage=self._header_footer)]
        )

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(colors.HexColor("#888888"))
        w, h = A4
        canvas.drawCentredString(
            w / 2,
            1 * cm,
            f"{_INSTITUTE_NAME} \u00b7 {doc._report_title} \u00b7 "
            f"Generated on {self._report_date.strftime('%B %d, %Y')} \u00b7 Page {doc.page}",
        )
        canvas.restoreState()


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------

def _build_pdf(title, sections, landscape_mode=False):
    buffer = BytesIO()
    page_size = landscape(A4) if landscape_mode else A4
    doc = _ReportDocTemplate(buffer, title, pagesize=page_size)
    doc.topMargin = 1.8 * cm
    doc.bottomMargin = 1.8 * cm
    doc.leftMargin = 1.8 * cm
    doc.rightMargin = 1.8 * cm

    story = []

    title_style = ParagraphStyle(
        "ReportTitle",
        fontSize=18,
        spaceAfter=2,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1a237e"),
    )
    story.append(Paragraph(title, title_style))

    inst_style = ParagraphStyle(
        "InstituteName",
        fontSize=10,
        spaceAfter=2,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#666666"),
        fontName="Helvetica",
    )
    story.append(Paragraph(_INSTITUTE_NAME, inst_style))

    date_style = ParagraphStyle(
        "ReportDate",
        fontSize=8,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#999999"),
        fontName="Helvetica",
    )
    story.append(
        Paragraph(
            f"Generated on: {date.today().strftime('%B %d, %Y')}", date_style
        )
    )
    story.append(Spacer(1, 6))

    for section_items in sections:
        for item in section_items:
            story.append(item)
        story.append(Spacer(1, 8))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# ---------------------------------------------------------------------------
# Student info helper
# ---------------------------------------------------------------------------

def _student_info_section(student):
    user = student.user
    items = []
    items.append(Paragraph("Student Information", _section_style()))
    data = [
        ("Name", f"{user.first_name} {user.last_name}".strip() or "-"),
        ("Email", user.email or "-"),
        ("Phone", user.phone_number or "-"),
        ("Branch", student.branch.name if student.branch else "-"),
        ("Date Joined", student.date_joined.strftime("%B %d, %Y") if student.date_joined else "-"),
        ("Status", "Active" if student.is_active else "Inactive"),
    ]
    if student.guardian_name:
        data.append(("Guardian", student.guardian_name))
    if student.guardian_phone:
        data.append(("Guardian Phone", student.guardian_phone))
    if student.guardian_email:
        data.append(("Guardian Email", student.guardian_email))

    table_data = [[Paragraph(k, _label_style()), Paragraph(v, _value_style())] for k, v in data]
    t = Table(table_data, colWidths=[3.5 * cm, 10 * cm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#eeeeee")),
            ]
        )
    )
    items.append(t)
    items.append(Spacer(1, 4))
    return items


# ---------------------------------------------------------------------------
# Report generators — student-level
# ---------------------------------------------------------------------------

def generate_student_report(student_id):
    student = get_object_or_404(
        Student.objects.select_related("user", "branch"), pk=student_id
    )
    sections = [_student_info_section(student)]

    # -- Enrollments --
    enrollments = list(
        Enrollment.objects.filter(student=student)
        .select_related("enrolled_class__sub_program__program", "enrolled_class__branch")
        .prefetch_related("payment")
        .order_by("-enrolled_at")
    )

    if enrollments:
        items = [Paragraph("Enrollments", _section_style())]
        headers = ["Class", "Sub Program", "Program", "Status", "Enrolled", "Payment"]
        rows = []
        for e in enrollments:
            payment_status = "N/A"
            pm = getattr(e, "payment", None)
            if pm:
                payment_status = pm.status
            rows.append(
                [
                    e.enrolled_class.name,
                    e.enrolled_class.sub_program.name,
                    e.enrolled_class.sub_program.program.name,
                    e.status,
                    e.enrolled_at.strftime("%Y-%m-%d") if e.enrolled_at else "-",
                    payment_status,
                ]
            )
        items.append(_make_table(rows, headers))
        items.append(Spacer(1, 4))
        sections.append(items)

        # -- Attendance & Progress per enrollment --
        for e in enrollments:
            cls_name = e.enrolled_class.name

            # Attendance
            records = (
                AttendanceRecord.objects.filter(enrollment=e)
                .values_list("status", flat=True)
            )
            counts = Counter(records)
            att_total = sum(counts.values())
            if att_total > 0:
                items = [Paragraph(f"Attendance \u2014 {cls_name}", _subsection_style())]
                headers = ["Present", "Absent", "Late", "Excused", "Total"]
                rows = [
                    [
                        str(counts.get(AttendanceStatus.PRESENT, 0)),
                        str(counts.get(AttendanceStatus.ABSENT, 0)),
                        str(counts.get(AttendanceStatus.LATE, 0)),
                        str(counts.get(AttendanceStatus.EXCUSED, 0)),
                        str(att_total),
                    ]
                ]
                items.append(_make_table(rows, headers))
                items.append(Spacer(1, 4))
                sections.append(items)

            # Progress
            progress_records = StudentProgress.objects.filter(enrollment=e).select_related("milestone")
            if progress_records.exists():
                items = [Paragraph(f"Progress \u2014 {cls_name}", _subsection_style())]
                headers = ["Milestone", "Status", "Remarks"]
                rows = []
                for p in progress_records.order_by("milestone__title"):
                    rows.append(
                        [
                            p.milestone.title,
                            p.status,
                            p.remarks or "",
                        ]
                    )
                items.append(_make_table(rows, headers))
                items.append(Spacer(1, 4))
                sections.append(items)

    # -- Certificates --
    certs = StudentCertificate.objects.filter(student=student).select_related(
        "sub_program", "issued_by"
    ).order_by("-issued_at")
    if certs.exists():
        items = [Paragraph("Certificates", _section_style())]
        headers = ["Certificate #", "Sub Program", "Issued Date", "Issued By"]
        rows = []
        for c in certs:
            issuer = f"{c.issued_by.first_name} {c.issued_by.last_name}".strip() or str(c.issued_by.email)
            rows.append(
                [
                    c.certificate_number,
                    c.sub_program.name,
                    c.issued_at.strftime("%Y-%m-%d") if c.issued_at else "-",
                    issuer,
                ]
            )
        items.append(_make_table(rows, headers))
        sections.append(items)

    return _build_pdf("Complete Academic Report", sections)


def generate_enrollment_report(student_id):
    student = get_object_or_404(
        Student.objects.select_related("user", "branch"), pk=student_id
    )
    sections = [_student_info_section(student)]

    enrollments = list(
        Enrollment.objects.filter(student=student)
        .select_related("enrolled_class__sub_program__program", "enrolled_class__branch")
        .prefetch_related("payment")
        .order_by("-enrolled_at")
    )

    items = [Paragraph("Enrollment History", _section_style())]
    headers = ["Class", "Sub Program", "Program", "Branch", "Status", "Enrolled", "Payment"]
    rows = []
    for e in enrollments:
        payment_status = "N/A"
        pm = getattr(e, "payment", None)
        if pm:
            payment_status = pm.status
        rows.append(
            [
                e.enrolled_class.name,
                e.enrolled_class.sub_program.name,
                e.enrolled_class.sub_program.program.name,
                e.enrolled_class.branch.name,
                e.status,
                e.enrolled_at.strftime("%Y-%m-%d") if e.enrolled_at else "-",
                payment_status,
            ]
        )
    items.append(_make_table(rows, headers))
    sections.append(items)

    return _build_pdf("Enrollment History", sections)


def generate_attendance_report(student_id, enrollment_id=None):
    student = get_object_or_404(
        Student.objects.select_related("user", "branch"), pk=student_id
    )
    sections = [_student_info_section(student)]

    enroll_qs = Enrollment.objects.filter(student=student).select_related(
        "enrolled_class__sub_program"
    )
    if enrollment_id:
        enroll_qs = enroll_qs.filter(pk=enrollment_id)
    enrollments = list(enroll_qs)

    items = [Paragraph("Attendance Summary", _section_style())]
    headers = ["Class", "Present", "Absent", "Late", "Excused", "Total"]
    rows = []
    for e in enrollments:
        records = AttendanceRecord.objects.filter(enrollment=e).values_list("status", flat=True)
        counts = Counter(records)
        total = sum(counts.values())
        rows.append(
            [
                e.enrolled_class.name,
                str(counts.get(AttendanceStatus.PRESENT, 0)),
                str(counts.get(AttendanceStatus.ABSENT, 0)),
                str(counts.get(AttendanceStatus.LATE, 0)),
                str(counts.get(AttendanceStatus.EXCUSED, 0)),
                str(total),
            ]
        )
    items.append(_make_table(rows, headers))
    sections.append(items)

    return _build_pdf("Attendance Summary", sections)


def generate_progress_report(student_id, enrollment_id=None):
    student = get_object_or_404(
        Student.objects.select_related("user", "branch"), pk=student_id
    )
    sections = [_student_info_section(student)]

    enroll_qs = Enrollment.objects.filter(student=student).select_related(
        "enrolled_class__sub_program"
    )
    if enrollment_id:
        enroll_qs = enroll_qs.filter(pk=enrollment_id)
    enrollments = list(enroll_qs)

    items = [Paragraph("Learning Progress Summary", _section_style())]
    for e in enrollments:
        items.append(Paragraph(f"Class: {e.enrolled_class.name}", _subsection_style()))
        progress_records = StudentProgress.objects.filter(enrollment=e).select_related("milestone")
        if not progress_records.exists():
            items.append(Paragraph("No progress records.", _body_style()))
            continue
        headers = ["Milestone", "Status", "Completed", "Remarks"]
        rows = []
        for p in progress_records.order_by("milestone__title"):
            completed = p.completed_at.strftime("%Y-%m-%d") if p.completed_at else "-"
            rows.append([p.milestone.title, p.status, completed, p.remarks or ""])
        items.append(_make_table(rows, headers))
        items.append(Spacer(1, 4))

        counts = Counter(progress_records.values_list("status", flat=True))
        summary = (
            f"Summary: {counts.get(ProgressStatus.COMPLETED, 0)} completed, "
            f"{counts.get(ProgressStatus.IN_PROGRESS, 0)} in progress, "
            f"{counts.get(ProgressStatus.NOT_STARTED, 0)} not started "
            f"({progress_records.count()} total)"
        )
        items.append(Paragraph(summary, _body_style()))
        items.append(Spacer(1, 4))

    sections.append(items)
    return _build_pdf("Learning Progress Summary", sections)


def generate_certificate_report(student_id):
    student = get_object_or_404(
        Student.objects.select_related("user", "branch"), pk=student_id
    )
    sections = [_student_info_section(student)]

    certs = StudentCertificate.objects.filter(student=student).select_related(
        "sub_program", "issued_by", "certificate"
    ).order_by("-issued_at")

    items = [Paragraph("Issued Certificates", _section_style())]
    if not certs.exists():
        items.append(Paragraph("No certificates issued.", _body_style()))
    else:
        headers = ["Certificate #", "Title", "Sub Program", "Issued Date", "Issued By"]
        rows = []
        for c in certs:
            issuer = f"{c.issued_by.first_name} {c.issued_by.last_name}".strip() or str(c.issued_by.email)
            rows.append(
                [
                    c.certificate_number,
                    c.certificate.title,
                    c.sub_program.name,
                    c.issued_at.strftime("%Y-%m-%d") if c.issued_at else "-",
                    issuer,
                ]
            )
        items.append(_make_table(rows, headers))
    sections.append(items)

    return _build_pdf("Issued Certificates", sections)


# ---------------------------------------------------------------------------
# Report generators — staff-level
# ---------------------------------------------------------------------------

def generate_class_report(class_id):
    klass = get_object_or_404(
        Class.objects.select_related("sub_program__program", "branch", "instructor"),
        pk=class_id,
    )

    items = []
    items.append(Paragraph("Class Information", _section_style()))
    info_data = [
        ("Name", klass.name),
        ("Sub Program", klass.sub_program.name),
        ("Program", klass.sub_program.program.name),
        ("Branch", klass.branch.name),
        ("Instructor", f"{klass.instructor.first_name} {klass.instructor.last_name}".strip()),
        ("Type", klass.class_type),
        ("Period", klass.class_period or "-"),
        ("Capacity", str(klass.capacity) if klass.capacity else "-"),
        ("Status", "Active" if klass.is_active else "Inactive"),
    ]
    if klass.start_date:
        info_data.append(("Start Date", klass.start_date.strftime("%Y-%m-%d")))
    if klass.end_date:
        info_data.append(("End Date", klass.end_date.strftime("%Y-%m-%d")))

    table_data = [[Paragraph(k, _label_style()), Paragraph(v, _value_style())] for k, v in info_data]
    t = Table(table_data, colWidths=[3.5 * cm, 10 * cm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#eeeeee")),
            ]
        )
    )
    items.append(t)
    items.append(Spacer(1, 6))

    # Enrolled students
    enrollments = list(
        Enrollment.objects.filter(enrolled_class=klass)
        .select_related("student__user")
        .order_by("student__user__first_name")
    )
    if enrollments:
        items.append(Paragraph(f"Enrolled Students ({len(enrollments)})", _section_style()))
        headers = ["#", "Student Name", "Email", "Status"]
        rows = []
        for i, e in enumerate(enrollments, 1):
            rows.append(
                [
                    str(i),
                    f"{e.student.user.first_name} {e.student.user.last_name}".strip(),
                    e.student.user.email or "-",
                    e.status,
                ]
            )
        items.append(_make_table(rows, headers))
        items.append(Spacer(1, 6))

    # Attendance sessions
    sessions = AttendanceSession.objects.filter(enrolled_class=klass).annotate(
        record_count=Count("records")
    ).order_by("-session_date")
    if sessions.exists():
        items.append(Paragraph("Attendance Sessions", _section_style()))
        headers = ["Date", "Topic", "Recorded By", "Records"]
        rows = []
        for s in sessions:
            record_count = s.record_count
            recorder = f"{s.recorded_by.first_name} {s.recorded_by.last_name}".strip() or str(s.recorded_by.email)
            rows.append(
                [
                    s.session_date.strftime("%Y-%m-%d") if s.session_date else "-",
                    s.topic or "-",
                    recorder,
                    str(record_count),
                ]
            )
        items.append(_make_table(rows, headers))

    sections = [items]
    return _build_pdf(f"Class Report \u2014 {klass.name}", sections)


def generate_sub_program_report(sub_program_id, branch_ids=None):
    sub = get_object_or_404(
        SubProgram.objects.select_related("program"), pk=sub_program_id
    )

    items = []
    items.append(Paragraph("Sub Program Information", _section_style()))
    info_data = [
        ("Name", sub.name),
        ("Program", sub.program.name),
        ("Group Fee", str(sub.group_fee)),
        ("Individual Fee", str(sub.individual_fee)),
        ("Duration", f"{sub.duration} {sub.duration_unit}" if sub.duration else "-"),
        ("Status", "Active" if sub.is_active else "Inactive"),
    ]
    table_data = [[Paragraph(k, _label_style()), Paragraph(v, _value_style())] for k, v in info_data]
    t = Table(table_data, colWidths=[3.5 * cm, 10 * cm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#eeeeee")),
            ]
        )
    )
    items.append(t)
    items.append(Spacer(1, 6))

    class_qs = Class.objects.filter(sub_program=sub).select_related("branch", "instructor").annotate(enrollment_count=Count("enrollments"))
    if branch_ids is not None:
        class_qs = class_qs.filter(branch_id__in=branch_ids)
    
    classes = list(class_qs.order_by("name"))
    if classes:
        items.append(Paragraph(f"Classes ({len(classes)})", _section_style()))
        headers = ["Name", "Branch", "Instructor", "Type", "Capacity", "Enrollments", "Active"]
        rows = []
        for c in classes:
            enroll_count = c.enrollment_count
            rows.append(
                [
                    c.name,
                    c.branch.name,
                    f"{c.instructor.first_name} {c.instructor.last_name}".strip(),
                    c.class_type,
                    str(c.capacity) if c.capacity else "-",
                    str(enroll_count),
                    "Yes" if c.is_active else "No",
                ]
            )
        items.append(_make_table(rows, headers))

    sections = [items]
    return _build_pdf(f"Sub Program Report \u2014 {sub.name}", sections)


def generate_program_report(program_id, branch_ids=None):
    prog = get_object_or_404(Program, pk=program_id)

    items = []
    items.append(Paragraph("Program Information", _section_style()))
    info_data = [
        ("Name", prog.name),
        ("Description", prog.description or "-"),
        ("Group Classes", "Supported" if prog.supports_group else "Not Supported"),
        ("Individual Classes", "Supported" if prog.supports_individual else "Not Supported"),
        ("Status", "Active" if prog.is_active else "Inactive"),
    ]
    table_data = [[Paragraph(k, _label_style()), Paragraph(v, _value_style())] for k, v in info_data]
    t = Table(table_data, colWidths=[4 * cm, 9.5 * cm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#eeeeee")),
            ]
        )
    )
    items.append(t)
    items.append(Spacer(1, 6))

    subs_qs = SubProgram.objects.filter(program=prog)
    if branch_ids is not None:
        from django.db.models import Q
        subs_qs = subs_qs.annotate(
            class_count=Count("classes", filter=Q(classes__branch_id__in=branch_ids), distinct=True),
            total_enrollments=Count("classes__enrollments", filter=Q(classes__branch_id__in=branch_ids), distinct=True),
        )
    else:
        subs_qs = subs_qs.annotate(
            class_count=Count("classes", distinct=True),
            total_enrollments=Count("classes__enrollments", distinct=True),
        )
        
    subs = list(subs_qs.order_by("name"))
    if subs:
        items.append(Paragraph(f"Sub Programs ({len(subs)})", _section_style()))
        headers = ["Name", "Fee", "Duration", "Classes", "Total Enrollments"]
        rows = []
        for s in subs:
            class_count = s.class_count
            total_enrollments = s.total_enrollments
            rows.append(
                [
                    s.name,
                    f"Group: {s.group_fee}, Individual: {s.individual_fee}",
                    f"{s.duration} {s.duration_unit}" if s.duration else "-",
                    str(class_count),
                    str(total_enrollments),
                ]
            )
        items.append(_make_table(rows, headers))

    sections = [items]
    return _build_pdf(f"Program Report \u2014 {prog.name}", sections)
