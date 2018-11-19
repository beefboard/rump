import requestPromise from 'request-promise';

export const VOTES_API = process.env.VOTES_API || 'http://localhost:2737';

interface PostVotes {
  [postId: string]: object;
}

export async function getGrades(postIds: string[], username?: string): Promise<PostVotes> {
  return (await requestPromise.get(`${VOTES_API}/v1/grades`, { json: true }).qs({
    posts: postIds,
    user: username
  })) as any;
}

export async function getGrade(postId: string, username?: string) {
  return await requestPromise
    .get(
      `${VOTES_API}/v1/grades/${postId}`,
      { json: true }
      ).qs({
        user: username
      });
}

export async function addGrade(postId: string, username: string, grade: number) {
  return (await requestPromise
    .post(
      `${VOTES_API}/v1/grades/${postId}`, {
        body: {
          user: username,
          grade: grade
        },
        json: true
      })
    ).success;
}
