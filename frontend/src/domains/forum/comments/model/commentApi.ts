import { http } from '@/src/shared/api/http';
import { MOCK_FORUM_POSTS } from '@/src/shared/constants/mock-data';
import type { ForumReply } from '@/src/shared/types';

const BASE = '/forum/comments';

export async function getReplies(postId: string): Promise<ForumReply[]> {
  try {
    const res = await http.get<ForumReply[]>(`${BASE}/?post=${postId}`);
    return res;
  } catch {
    const post = MOCK_FORUM_POSTS.find(p => p.id === postId);
    return post?.replies || [];
  }
}

export async function addReply(postId: string, reply: Omit<ForumReply, 'id'>): Promise<ForumReply> {
  try {
    return await http.post<ForumReply>(`${BASE}/`, { ...reply, post_id: postId });
  } catch {
    return { ...reply, id: Date.now().toString() };
  }
}
