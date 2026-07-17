from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0015_add_missing_db_indexes"),
    ]

    operations = [
        # --- Enrollment model changes ---
        migrations.AddField(
            model_name="enrollment",
            name="enrollment_number",
            field=models.CharField(
                max_length=50, unique=True, null=True, blank=True, db_index=True
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="pending_code",
            field=models.CharField(
                max_length=50, unique=True, null=True, blank=True, db_index=True
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="verification_status",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("SUBMITTED", "Submitted"),
                    ("UNDER_REVIEW", "Under Review"),
                    ("VERIFIED", "Verified"),
                    ("REJECTED", "Rejected"),
                ],
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="rejection_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AlterField(
            model_name="enrollment",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING_VERIFICATION", "Pending Verification"),
                    ("ACTIVE", "Active"),
                    ("COMPLETED", "Completed"),
                    ("CANCELLED", "Cancelled"),
                    ("REJECTED", "Rejected"),
                ],
                db_index=True,
                default="PENDING_VERIFICATION",
                max_length=20,
            ),
        ),
        # --- EnrollmentPayment model changes ---
        migrations.RemoveField(
            model_name="enrollmentpayment",
            name="payment_provider",
        ),
        migrations.AddField(
            model_name="enrollmentpayment",
            name="attachment",
            field=models.FileField(
                null=True, blank=True, upload_to="payment_attachments/"
            ),
        ),
        migrations.AddField(
            model_name="enrollmentpayment",
            name="bank_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="enrollmentpayment",
            name="transfer_reference",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="enrollmentpayment",
            name="verification_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="enrollmentpayment",
            name="verified_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="enrollmentpayment",
            name="verified_by",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="verified_payments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="enrollmentpayment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("CASH", "Cash"),
                    ("BANK_TRANSFER", "Bank Transfer"),
                    ("MOBILE_MONEY", "Mobile Money"),
                    ("CHEQUE", "Cheque"),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="enrollmentpayment",
            name="transaction_reference",
            field=models.CharField(
                blank=True, db_index=True, default="", max_length=255
            ),
        ),
        # --- SubProgram model changes ---
        migrations.AddField(
            model_name="subprogram",
            name="group_fee",
            field=models.DecimalField(
                decimal_places=2, max_digits=10, null=True, blank=True
            ),
        ),
        migrations.AddField(
            model_name="subprogram",
            name="individual_fee",
            field=models.DecimalField(
                decimal_places=2, max_digits=10, null=True, blank=True
            ),
        ),
        # --- Data migration: copy fee -> group_fee + individual_fee ---
        migrations.RunSQL(
            sql="""
                UPDATE academic_subprogram
                SET group_fee = fee, individual_fee = fee
                WHERE fee IS NOT NULL;
            """,
            reverse_sql="""
                UPDATE academic_subprogram
                SET fee = COALESCE(group_fee, individual_fee, 0)
                WHERE group_fee IS NOT NULL OR individual_fee IS NOT NULL;
            """,
        ),
        # --- Rename PENDING_PAYMENT -> PENDING_VERIFICATION in enrollment ---
        migrations.RunSQL(
            sql="""
                UPDATE academic_enrollment
                SET status = 'PENDING_VERIFICATION'
                WHERE status = 'PENDING_PAYMENT';
            """,
            reverse_sql="""
                UPDATE academic_enrollment
                SET status = 'PENDING_PAYMENT'
                WHERE status = 'PENDING_VERIFICATION';
            """,
        ),
        # --- Set verification_status=VERIFIED for ACTIVE enrollments with PAID payment ---
        migrations.RunSQL(
            sql="""
                UPDATE academic_enrollment
                SET verification_status = 'VERIFIED'
                WHERE status = 'ACTIVE'
                  AND id IN (
                      SELECT enrollment_id
                      FROM academic_enrollmentpayment
                      WHERE status = 'PAID'
                  );
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # --- Rename ONLINE -> BANK_TRANSFER in payment_method ---
        migrations.RunSQL(
            sql="""
                UPDATE academic_enrollmentpayment
                SET payment_method = 'BANK_TRANSFER'
                WHERE payment_method = 'ONLINE';
            """,
            reverse_sql="""
                UPDATE academic_enrollmentpayment
                SET payment_method = 'ONLINE'
                WHERE payment_method = 'BANK_TRANSFER';
            """,
        ),
        # --- Make group_fee and individual_fee non-nullable now ---
        migrations.AlterField(
            model_name="subprogram",
            name="group_fee",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.AlterField(
            model_name="subprogram",
            name="individual_fee",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        # --- Remove old fee field ---
        migrations.RemoveField(
            model_name="subprogram",
            name="fee",
        ),
    ]
