import { onlineEnrollApi, type OnlineEnrollmentResponse } from '@/domains/learning/academics/api/academicApi';
import { cacheStudentId } from '@/domains/user/student/api/studentContext';

export type PaymentMethodType = 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'CASH';

export interface StudentRegistrationRequest {
  name: string;
  studentEmail: string;
  password: string;
  age?: string;
  grade?: string;
  school?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  /** Academic class UUID from backend catalog */
  enrolledClassId: string;
  paymentMethod: PaymentMethodType;
  bank_name?: string;
  transaction_reference?: string;
  transfer_reference?: string;
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export async function registerApi(data: StudentRegistrationRequest): Promise<OnlineEnrollmentResponse> {
  const { first_name, last_name } = splitName(data.name);

  const result = await onlineEnrollApi({
    enrolled_class: data.enrolledClassId,
    email: data.studentEmail,
    first_name,
    last_name,
    password: data.password,
    phone_number: data.parentPhone || undefined,
    guardian_name: data.parentName,
    guardian_phone: data.parentPhone,
    guardian_email: data.parentEmail,
    payment_method: data.paymentMethod,
    bank_name: data.bank_name,
    transaction_reference: data.transaction_reference,
    transfer_reference: data.transfer_reference,
  });

  const studentId =
    result.student ||
    (result.enrollment as { student?: string })?.student;
  if (studentId && data.studentEmail) {
    cacheStudentId(data.studentEmail, studentId);
  }

  return result;
}
