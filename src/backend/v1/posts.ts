import * as requestPromise from 'request-promise';

export const POSTS_API = process.env.POSTS_API || 'http://localhost:2833';

interface Post {
  id: string;
  author: string;
  approved: boolean;
  votes?: object;
}

export interface PostsQuery {
  approved?: string | boolean;
  page?: number;
  limit?: number;
}

export async function getPosts(query: PostsQuery) {
  return (
    await requestPromise.get(
      `${POSTS_API}/v1/posts`,
      { qs: query, json: true }
    )
  ).posts as Post[];
}

export async function getPost(id: string) {
  return (await requestPromise.get(`${POSTS_API}/v1/posts/${id}`, { json: true })) as Post;
}

export async function newPost(details: any) {
  return (
    await requestPromise.post(
      `${POSTS_API}/v1/posts`,
      { body: details, json: true }
    )
  ).id as string;
}

export async function deletePost(id: string) {
  try {
    await requestPromise.delete(`${POSTS_API}/v1/posts/${id}`);
  } catch (e) {
    if (!e.statusCode || e.statusCode !== 404) {
      throw e;
    }
  }
}

export async function setPostApproval(id: string, approval: boolean) {
  return (
    await requestPromise.put(
      `${POSTS_API}/v1/posts/${id}/approved`,
      { body: { approved: approval }, json: true }
    )
  ).success as boolean;
}

export async function setPostPinned(id: string, pinned: boolean) {
  return (
    await requestPromise.put(
      `${POSTS_API}/v1/posts/${id}/pinned`,
      { body: { pinned: pinned }, json: true }
    )
  ).success as boolean;
}
