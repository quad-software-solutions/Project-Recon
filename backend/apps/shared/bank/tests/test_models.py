from django.test import TestCase

from apps.shared.bank.models import BankAccount


class BankAccountModelTest(TestCase):
    def setUp(self):
        self.account = BankAccount.objects.create(
            bank_name="Test Bank",
            account_holder="John Doe",
            account_number="ACC123456",
            branch="Main Branch",
            swift_code="SWIFT123",
            iban="IBAN123",
        )

    def test_create_bank_account(self):
        expected = "Test Bank — John Doe (ACC123456)"
        self.assertEqual(str(self.account), expected)

    def test_default_is_active(self):
        self.assertTrue(self.account.is_active)

    def test_default_notes_blank(self):
        self.assertEqual(self.account.notes, "")

    def test_uuid_pk(self):
        import uuid
        self.assertIsInstance(self.account.id, uuid.UUID)

    def test_ordering(self):
        BankAccount.objects.create(
            bank_name="Alpha Bank", account_holder="Jane", account_number="ACC999",
        )
        accounts = BankAccount.objects.all()
        self.assertEqual(accounts[0].bank_name, "Alpha Bank")
