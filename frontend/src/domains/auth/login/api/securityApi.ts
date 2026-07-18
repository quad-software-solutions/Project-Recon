import { http } from '../../../../shared/api/http';
import { getOrCreateDeviceId } from '@/shared/utils/storage';

function currentDevicePayload() {
  const deviceId = getOrCreateDeviceId();
  return {
    device_id: deviceId,
    fingerprint: deviceId,
    device_name: navigator.platform || 'Browser',
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    user_agent: navigator.userAgent,
  };
}

export const securityApi = {
  changePassword: (data: { old_password: string; new_password: string }) =>
    http.put('/accounts/password/change/', data),

  logoutAllSessions: () => http.post('/accounts/logout/all/', {}),

  requestEmailVerification: () => http.post('/accounts/email-verification/request/', {}),
  verifyEmail: (otp: string) => http.post('/accounts/email-verification/verify/', { otp }),

  listDevices: () => http.get('/accounts/devices/'),
  revokeDevice: (id: string) => http.delete(`/accounts/devices/${id}/`),
  revokeAllDevices: () => http.post('/accounts/devices/revoke-all/', {}),

  /** Request OTP to trust the current browser device (authenticated). */
  requestDeviceVerification: () =>
    http.post('/accounts/device-verification/request/', currentDevicePayload()),

  /** Complete device trust with OTP for the current browser. */
  verifyDevice: (otp: string) =>
    http.post('/accounts/device-verification/verify/', {
      ...currentDevicePayload(),
      otp,
    }),
};
