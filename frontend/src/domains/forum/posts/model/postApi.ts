import { http } from '@/src/shared/api/http';
import type { ForumPost } from '@/src/shared/types';

const BASE = '/forum/posts';

export async function getForumPosts(): Promise<ForumPost[]> {
  const res = await http.get<{ results: ForumPost[] }>(`${BASE}/`);
  return res.results;
}

export async function getForumPostById(id: string): Promise<ForumPost | undefined> {
  return await http.get<ForumPost>(`${BASE}/${id}/`);
}
