import { ShieldOff } from 'lucide-react';

interface PermissionDeniedProps {
  title?: string;
  message?: string;
}

export default function PermissionDenied({
  title = 'Permission denied',
  message = 'You do not have access to this section. Contact an administrator if you believe this is an error.',
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
        <ShieldOff className="w-7 h-7 text-slate-400" />
      </div>
      <h2 className="font-bold text-lg text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">{message}</p>
    </div>
  );
}
