import * as requestPromise from 'request-promise';
import { Response, Request } from 'express';

export const POSTS_API = process.env.POSTS_API || 'http://localhost:2835';
const TEST_MODE = process.env.NODE_ENV === 'test';

interface Post {
  author: string;
  approved: boolean;
}

export interface PostsQuery {
  approved?: string | boolean;
  page?: number;
  limit?: number;
}

function proxy(request: requestPromise.RequestPromise, res: Response) {
  request.then(() => {}).catch(() => {});
  request.on('error', (e) => {
    if (!TEST_MODE) {
      console.log('Error forwarding posts request');
      console.error(e);
    }
    res.status(500).send({ error: 'Internal server error' });
  });
  request.callback = () => {};
  request.pipe(res);
}

export function forwardGetPosts(query: PostsQuery, res: Response) {
  proxy(requestPromise.get(`${POSTS_API}/v1/posts`, { qs: query }), res);
}

export async function getPost(id: string) {
  return (await requestPromise.get(`${POSTS_API}/v1/posts/${id}`, { json: true })) as Post;
}

export async function newPost(details: any) {
  return (await requestPromise.post(`${POSTS_API}/v1/posts`, { body: details, json: true })).id;
}

export async function deletePost(id: string) {
  try {
    await requestPromise.delete(`${POSTS_API}/v1/posts/${id}`);
  } catch (e) {
    if (e.statusCode && e.statusCode !== 404) {
      throw e;
    }
  }
}

export function forwardRequest(req: Request, res: Response) {
  const path = req.path.split('posts/')[1];

  const request = requestPromise.default(`${POSTS_API}/v1/posts/${path}`);
  req.pipe(request);
  proxy(request, res);
}
