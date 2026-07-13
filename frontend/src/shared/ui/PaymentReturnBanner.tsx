import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { usePaymentReturnVerification } from '../hooks/usePaymentReturnVerification';

export default function PaymentReturnBanner() {
  const { status, message, dismiss } = usePaymentReturnVerification();

  if (status === 'idle' || !message) return null;

  const styles =
    status === 'verifying' ? 'bg-blue-50 border-blue-200 text-blue-800' :
    status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
    'bg-red-50 border-red-200 text-red-800';

  const Icon =
    status === 'verifying' ? Loader2 :
    status === 'success' ? CheckCircle2 :
    AlertCircle;

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-lg w-[calc(100%-2rem)] border rounded-2xl px-4 py-3 shadow-lg ${styles}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${status === 'verifying' ? 'animate-spin' : ''}`} />
        <p className="text-sm font-medium flex-1">{message}</p>
        {status !== 'verifying' && (
          <button onClick={dismiss} className="p-1 rounded-lg hover:bg-black/5" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
