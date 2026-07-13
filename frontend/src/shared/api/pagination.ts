export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Unwrap a list or paginated `{ results }` response. */
export function unwrapList<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Fetch every page from a paginated DRF endpoint.
 * Stops when `next` is null or after `maxPages` (safety cap).
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  maxPages = 20,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const res = await fetchPage(page);
    all.push(...(res.results ?? []));
    hasMore = Boolean(res.next);
    page += 1;
  }

  return all;
}
