from django.test import Client
from apps.accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
import re

captured_otps = []

def mock_send_mail(subject, message, from_email, recipient_list, **kwargs):
    match = re.search(r'password is: (\d+)', message)
    if match:
        captured_otps.append(match.group(1))
    return 1

def run_tests():
    # Setup user
    user = User.objects.get(email='anom@gmail.com')
    user.is_email_verified = False
    user.status = 'PENDING'
    user.save()

    client = Client(HTTP_HOST='localhost')
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}

    print("--- TESTING EMAIL VERIFICATION FLOW ---")
    print("1. Triggering Email Verification Request...")
    
    with patch('django.core.mail.send_mail', mock_send_mail):
        response = client.post('/api/v1/accounts/email-verification/request/', **auth_headers)
        
    if response.status_code == 204:
        print("SUCCESS: Email verification requested successfully.")
    else:
        print(f"FAILED: Expected 204, got {response.status_code} - {response.content}")
        return

    valid_email_otp = captured_otps.pop()
    print(f"Captured Plaintext OTP: {valid_email_otp}")

    print("2. Submitting Invalid OTP...")
    response = client.post('/api/v1/accounts/email-verification/verify/', {'otp': '000000'}, content_type='application/json', **auth_headers)
    if response.status_code in [400, 401, 403]: 
        print(f"SUCCESS: Invalid OTP rejected with status {response.status_code}")
    else:
        print(f"FAILED: Expected error status (4xx), got {response.status_code} - {response.content}")

    print("3. Submitting Valid OTP...")
    response = client.post('/api/v1/accounts/email-verification/verify/', {'otp': valid_email_otp}, content_type='application/json', **auth_headers)
    if response.status_code == 204:
        print("SUCCESS: Valid OTP accepted, email verified and access granted.")
    else:
        print(f"FAILED: Expected 204, got {response.status_code} - {response.content}")

    user.refresh_from_db()
    print(f"User is_email_verified after valid OTP: {user.is_email_verified}")


    print("\n--- TESTING DEVICE VERIFICATION FLOW ---")
    print("4. Triggering Device Verification Request...")
    device_info = {
        'device_id': 'test-device-id-123',
        'fingerprint': 'test-fingerprint-123',
        'user_agent': 'pytest',
        'ip_address': '127.0.0.1'
    }
    
    with patch('django.core.mail.send_mail', mock_send_mail):
        response = client.post('/api/v1/accounts/device-verification/request/', device_info, content_type='application/json', **auth_headers)
        
    if response.status_code == 204:
        print("SUCCESS: Device verification requested successfully.")
    else:
        print(f"FAILED: Expected 204, got {response.status_code} - {response.content}")
        return

    valid_device_otp = captured_otps.pop()
    print(f"Captured Plaintext Device OTP: {valid_device_otp}")

    print("5. Submitting Invalid Device OTP...")
    response = client.post('/api/v1/accounts/device-verification/verify/', {'otp': '000000', **device_info}, content_type='application/json', **auth_headers)
    if response.status_code in [400, 401, 403]:
        print(f"SUCCESS: Invalid Device OTP rejected with status {response.status_code}")
    else:
        print(f"FAILED: Expected error status (4xx), got {response.status_code} - {response.content}")

    print("6. Submitting Valid Device OTP...")
    response = client.post('/api/v1/accounts/device-verification/verify/', {'otp': valid_device_otp, **device_info}, content_type='application/json', **auth_headers)
    if response.status_code == 200:
        print("SUCCESS: Valid Device OTP accepted, device registered.")
    else:
        print(f"FAILED: Expected 200, got {response.status_code} - {response.content}")

run_tests()
