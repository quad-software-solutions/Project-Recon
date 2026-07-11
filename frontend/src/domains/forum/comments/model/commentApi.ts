import { http } from '@/src/shared/api/http';
import type { ForumReply } from '@/src/shared/types';

const BASE = '/forum/comments';

export async function getReplies(postId: string): Promise<ForumReply[]> {
  const res = await http.get<ForumReply[]>(`${BASE}/?post=${postId}`);
  return res;
}

export async function addReply(postId: string, reply: Omit<ForumReply, 'id'>): Promise<ForumReply> {
  try {
    return await http.post<ForumReply>(`${BASE}/`, { ...reply, post_id: postId });
  } catch {
    return { ...reply, id: Date.now().toString() };
  }
}
