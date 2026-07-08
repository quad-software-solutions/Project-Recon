import { UserProfile } from '../../shared/types';
import StudentDashboard from '../../domains/user/student/dashboard/ui/StudentDashboard';
import TeacherDashboard from '../../domains/user/teacher/dashboard/ui/TeacherDashboard';
import ManagerDashboard from '../../domains/user/manager/dashboard/ui/ManagerDashboard';
import AdminDashboard from '../../domains/user/shared/ui/AdminDashboard';
import SecretaryDashboard from '../../domains/user/secretary/dashboard/ui/SecretaryDashboard';

interface DashboardPageProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export default function DashboardPage({ currentUser, onLogout }: DashboardPageProps) {
  if (currentUser.role === 'Admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={onLogout} />;
  }
  if (currentUser.role === 'Manager') {
    return <ManagerDashboard currentUser={currentUser} onLogout={onLogout} />;
  }
  if (currentUser.role === 'Instructor') {
    return <TeacherDashboard currentUser={currentUser} onLogout={onLogout} />;
  }
  if (currentUser.role === 'Secretary') {
    return <SecretaryDashboard currentUser={currentUser} onLogout={onLogout} />;
  }
  return <StudentDashboard currentUser={currentUser} onLogout={onLogout} />;
}
