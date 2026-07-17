"""
Management command to create a terminal Super Admin account.

Terminal-created Super Admins bypass onboarding checks per the auth design spec.
"""
import os
import getpass

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.accounts.services import user_service


class Command(BaseCommand):
    """Create a Super Admin user via the management command path.

    Terminal-created Super Admins bypass onboarding checks per the auth design spec.
    """

    help = "Create a super admin user"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Email address")
        parser.add_argument("--first-name", type=str, help="First name")
        parser.add_argument("--last-name", type=str, help="Last name")
        parser.add_argument("--password", type=str, help="Password")

    def handle(self, *args, **options):
        User = get_user_model()

        email = options.get("email") or os.environ.get("DJANGO_SUPERUSER_EMAIL")
        first_name = options.get("first_name") or os.environ.get("DJANGO_SUPERUSER_FIRST_NAME", "Admin")
        last_name = options.get("last_name") or os.environ.get("DJANGO_SUPERUSER_LAST_NAME", "User")
        password = options.get("password") or os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        # Only fall back to interactive prompts if nothing was supplied at all
        # (safe for local use, never triggers during a non-interactive build)
        if not email and os.environ.get("DJANGO_SUPERUSER_EMAIL") is None and options.get("email") is None:
            email = input("Email: ")
        if not password and os.environ.get("DJANGO_SUPERUSER_PASSWORD") is None and options.get("password") is None:
            password = getpass.getpass("Password: ")

        if not email or not password:
            self.stdout.write(self.style.WARNING(
                "Skipping: no email/password provided via args or env vars."
            ))
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(f'Super admin "{email}" already exists, skipping.'))
            return

        user = user_service.create_super_admin(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Successfully created super admin with email: {user.email}")
        )