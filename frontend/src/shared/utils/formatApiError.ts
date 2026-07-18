import { isApiError } from '@/shared/api/http';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function stripUuids(msg: string): string {
  return msg.replace(UUID_RE, '').replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
}

export function formatApiError(err: unknown): string {
  if (isApiError(err)) {
    const msg = err.message ? stripUuids(err.message) : '';
    if (err.status === 400 || err.status === 422) return msg || 'Please check your input and try again.';
    if (err.status === 401) return 'Your session has expired. Please sign in again.';
    if (err.status === 403) return 'You do not have permission to perform this action.';
    if (err.status === 404) return 'The requested resource was not found. Please refresh and try again.';
    if (err.status === 405) return 'This action is not supported.';
    if (err.status === 409) return msg || 'This conflicts with an existing record.';
    if (err.status === 410) return 'This resource is no longer available.';
    if (err.status === 413) return 'The uploaded file is too large.';
    if (err.status === 415) return 'Unsupported file or content type.';
    if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return 'The service is temporarily unavailable. Please try again shortly.';
    }
    if (err.status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
    if (msg && /timeout|aborted/i.test(msg)) {
      return 'The request timed out. Please try again.';
    }
    return msg || 'Unable to complete the request.';
  }
  if (err instanceof TypeError || (err instanceof Error && /network|fetch|failed to fetch/i.test(err.message))) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  if (err instanceof Error && /timeout|aborted/i.test(err.message)) {
    return 'The request timed out. Please try again.';
  }
  if (err instanceof Error) return stripUuids(err.message);
  return 'Unable to complete the request. Please try again.';
}
