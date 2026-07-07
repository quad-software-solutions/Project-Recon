import { http } from '@/src/shared/api/http';
import { MOCK_FORUM_POSTS } from '@/src/shared/constants/mock-data';
import type { ForumPost } from '@/src/shared/types';

const BASE = '/forum/posts';

export async function getForumPosts(): Promise<ForumPost[]> {
  try {
    const res = await http.get<{ results: ForumPost[] }>(`${BASE}/`);
    return res.results;
  } catch {
    return MOCK_FORUM_POSTS;
  }
}

export async function getForumPostById(id: string): Promise<ForumPost | undefined> {
  try {
    return await http.get<ForumPost>(`${BASE}/${id}/`);
  } catch {
    return MOCK_FORUM_POSTS.find(p => p.id === id);
  }
}
