import { http } from '../../../../shared/api/http';

export const securityApi = {
  /**
   * Change logged-in user's password
   */
  changePassword: (data: { old_password: string; new_password: string }) => http.put('/accounts/password/change/', data),

  /**
   * Email Verification flow
   */
  requestEmailVerification: () => http.post('/accounts/email-verification/request/', {}),
  verifyEmail: (otp: string) => http.post('/accounts/email-verification/verify/', { otp }),

  /**
   * Trusted Devices flow
   */
  listDevices: () => http.get('/accounts/devices/'),
  revokeDevice: (id: string) => http.delete(`/accounts/devices/${id}/`),
  revokeAllDevices: () => http.post('/accounts/devices/revoke-all/', {}),
  requestDeviceVerification: (deviceId: string) => http.post('/accounts/device-verification/request/', { device_id: deviceId }),
  verifyDevice: (deviceId: string, otp: string) => http.post('/accounts/device-verification/verify/', { device_id: deviceId, otp }),
};
