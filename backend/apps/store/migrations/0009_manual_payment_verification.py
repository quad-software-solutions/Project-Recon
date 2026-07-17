# Generated manually for Manual Payment Verification System

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0008_add_missing_indexes'),
    ]

    operations = [
        # Remove old Chapa-related fields
        migrations.RemoveField(
            model_name='storepayment',
            name='payment_provider',
        ),
        migrations.RemoveField(
            model_name='storepayment',
            name='refund_reference',
        ),
        migrations.RemoveField(
            model_name='storepayment',
            name='refunded_at',
        ),
        # Add new fields for manual verification
        migrations.AddField(
            model_name='storepayment',
            name='bank_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='storepayment',
            name='attachment',
            field=models.FileField(blank=True, null=True, upload_to='payment_attachments/'),
        ),
        migrations.AddField(
            model_name='storepayment',
            name='verified_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='verified_store_payments',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='storepayment',
            name='verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='storepayment',
            name='verification_notes',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='storepayment',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        # Remove unique constraint and add blank/default on transaction_reference
        migrations.AlterField(
            model_name='storepayment',
            name='transaction_reference',
            field=models.CharField(blank=True, db_index=True, default='', max_length=255),
        ),
        # Remove PENDING_PAYMENT from Order status, default to PAID
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('PAID', 'Paid'),
                    ('PREPARING', 'Preparing'),
                    ('READY_FOR_PICKUP', 'Ready for Pickup'),
                    ('COMPLETED', 'Completed'),
                    ('CANCELLED', 'Cancelled'),
                    ('REFUNDED', 'Refunded'),
                ],
                db_index=True,
                default='PAID',
                max_length=20,
            ),
        ),
        # Remove unique constraint on Order payment_reference
        migrations.AlterField(
            model_name='order',
            name='payment_reference',
            field=models.CharField(blank=True, db_index=True, default='', max_length=255),
        ),
    ]
