import { useEffect, useState } from 'react';
import { verifyOnlinePaymentApi } from '@/src/domains/learning/academics/api/academicApi';
import { verifyEventPayment } from '@/src/domains/competition/api/eventsApi';

export type PaymentVerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

function readPaymentReference(): string | null {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('reference') ||
    params.get('tx_ref') ||
    params.get('trxref') ||
    params.get('payment_reference')
  );
}

function clearPaymentParams() {
  const url = new URL(window.location.href);
  ['reference', 'tx_ref', 'trxref', 'payment_reference', 'status'].forEach(key => {
    url.searchParams.delete(key);
  });
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

/**
 * On return from Chapa/payment provider, verify academic or event payments.
 * Academic: POST /academic/enrollments/online/verify/
 * Events: POST /events/payments/online/verify/
 */
export function usePaymentReturnVerification() {
  const [status, setStatus] = useState<PaymentVerifyStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const reference = readPaymentReference();
    if (!reference) return;

    const kind = new URLSearchParams(window.location.search).get('payment_kind');
    let cancelled = false;

    (async () => {
      setStatus('verifying');
      try {
        if (kind === 'event') {
          await verifyEventPayment(reference);
        } else {
          await verifyOnlinePaymentApi({ reference });
        }
        if (cancelled) return;
        setStatus('success');
        setMessage('Payment verified successfully. Your enrollment is being processed.');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Payment verification failed.');
      } finally {
        if (!cancelled) clearPaymentParams();
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { status, message, dismiss: () => { setStatus('idle'); setMessage(null); } };
}
