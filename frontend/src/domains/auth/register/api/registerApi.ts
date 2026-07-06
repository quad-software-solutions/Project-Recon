import { http } from '../../../../shared/api/http';

export interface StudentRegistrationRequest {
  name: string;
  studentEmail?: string;
  age: string;
  grade: string;
  school?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  selectedCourses: Array<{ name: string; format: 'class' | 'private'; price: number }>;
  paymentMethod: 'chapa' | 'stripe';
  total: number;
}

export async function registerApi(data: StudentRegistrationRequest): Promise<void> {
  const courseLines = data.selectedCourses
    .map(course => `- ${course.name} (${course.format}) - ${course.price.toLocaleString()} ETB`)
    .join('\n');

  await http.post('/cms/contact-requests/', {
    name: data.parentName,
    email: data.parentEmail,
    phone: data.parentPhone,
    subject: `Student registration request: ${data.name}`,
    description: [
      `Student: ${data.name}`,
      data.studentEmail ? `Student email: ${data.studentEmail}` : null,
      `Age: ${data.age}`,
      `Grade: ${data.grade}`,
      data.school ? `School: ${data.school}` : null,
      `Payment method: ${data.paymentMethod}`,
      `Total: ${data.total.toLocaleString()} ETB`,
      '',
      'Selected courses:',
      courseLines,
    ].filter(Boolean).join('\n'),
  });
}
