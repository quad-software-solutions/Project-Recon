import { onlineEnrollApi, type OnlineEnrollmentPayload } from '@/domains/learning/academics/api/academicApi';
import { cacheStudentId } from '@/domains/user/student/api/studentContext';
import type { Enrollment, PaymentMethod } from '@/shared/types';

export type PaymentMethodType = PaymentMethod;

export interface StudentRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  subProgramId: string;
  classType: 'GROUP' | 'INDIVIDUAL';
  branchId: string;
  paymentMethod: PaymentMethodType;
  bankName?: string;
  transactionReference?: string;
  transferReference?: string;
  attachment?: File | null;
}

export async function registerApi(data: StudentRegistrationRequest): Promise<Enrollment> {
  const payload: OnlineEnrollmentPayload = {
    sub_program: data.subProgramId,
    class_type: data.classType,
    branch: data.branchId,
    email: data.email.trim(),
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    password: data.password,
    phone_number: data.phoneNumber.trim() || undefined,
    guardian_name: data.guardianName.trim(),
    guardian_phone: data.guardianPhone.trim(),
    guardian_email: data.guardianEmail.trim(),
    payment_method: data.paymentMethod,
  };

  if (data.paymentMethod !== 'CASH') {
    payload.transaction_reference = data.transactionReference?.trim() || '';
    payload.transfer_reference = data.transferReference?.trim() || '';
    payload.bank_name = data.bankName?.trim() || '';
    if (data.attachment) payload.attachment = data.attachment;
  }

  const enrollment = await onlineEnrollApi(payload);

  if (enrollment.student && data.email) {
    cacheStudentId(data.email.trim(), enrollment.student);
  }

  return enrollment;
}
