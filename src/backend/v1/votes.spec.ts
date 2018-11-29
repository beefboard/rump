import nock from 'nock';
import * as votes from './votes';

describe('backend v1/votes', () => {
  describe('getGrades', () => {
    it('returns the grades for the given post ids', async () => {
      const posts = ['testasdf', 'adsfd'];
      nock(votes.VOTES_API).get('/v1/grades')
      .query({ posts: posts })
      .reply(200, {
        testasdf: { grade: 0 },
        adsfd: { grade: 1 }
      });

      const grades = await votes.getGrades(posts);
      expect(grades).toEqual({
        testasdf: { grade: 0 },
        adsfd: { grade: 1 }
      });
    });

    it('returns the users grade when user given', async () => {
      const posts = ['testasdf', 'adsfd'];
      const user = 'fsdfds';
      nock(votes.VOTES_API).get('/v1/grades')
        .query({ posts: posts, user: user })
        .reply(200, {
          testasdf: { grade: 0 },
          adsfd: { grade: 1 }
        });

      const grades = await votes.getGrades(posts, user);
      expect(grades).toEqual({
        testasdf: { grade: 0 },
        adsfd: { grade: 1 }
      });
    });

    it('should return an error on a server side error', async () => {
      const posts = ['testasdf', 'adsfd'];
      const user = 'fsdfds';
      nock(votes.VOTES_API).get('/v1/grades')
        .query({ posts: posts, user: user })
        .reply(500, {
          error: 'Some error'
        });

      let error = null;
      try {
        await votes.getGrades(posts, user);
      } catch (e) {
        error = e;
      }

      expect(error).not.toBe(null);
    });
  });

  describe('getGrade', async () => {
    it('should return the grade of the given post from the api', async () => {
      const post = 'asdfadsf';
      nock(votes.VOTES_API).get(`/v1/grades/${post}`)
        .reply(200, { grade: 1 });

      const grades = await votes.getGrade(post);
      expect(grades).toEqual({ grade: 1 });
    });

    it('should return the users grade when user given', async () => {
      const post = 'asdfadsf';
      const user = 'usersdf';
      nock(votes.VOTES_API).get(`/v1/grades/${post}`)
        .query({ user: user })
        .reply(200, {
          grade: -1,
          [user]: 0
        });

      const grades = await votes.getGrade(post, user);
      expect(grades).toEqual({ grade: -1, [user]: 0 });
    });

    it('should return an error on a server side error', async () => {
      const post = 'testasdf';
      const user = 'fsdfds';
      nock(votes.VOTES_API).get(`/v1/grades/${post}`)
        .query({ user: user })
        .reply(500, {
          error: 'Some error'
        });

      let error = null;
      try {
        await votes.getGrade(post, user);
      } catch (e) {
        error = e;
      }

      expect(error).not.toBe(null);
    });
  });

  describe('addGrade', () => {
    it('should add a grade to the votes api', async () => {
      const post = 'asdfasdfsd';
      const user = 'asdfsdf';
      const grade = -1;

      nock(votes.VOTES_API)
        .put(`/v1/grades/${post}`, { user: user, grade: -1 })
        .reply(200, {
          success: true
        });

      const success = await votes.addGrade(post, user, grade);
      expect(success).toBe(true);
    });

    it('should add a grade to the votes api', async () => {
      const post = 'asdfasdfsd';
      const user = 'asdfsdf';
      const grade = 1;

      nock(votes.VOTES_API)
        .put(`/v1/grades/${post}`, { user: user, grade: 1 })
        .reply(200, {
          success: true
        });

      const success = await votes.addGrade(post, user, grade);
      expect(success).toBe(true);
    });

    it('should return an error on a server side error', async () => {
      const post = 'asdfasdfsd';
      const user = 'asdfsdf';
      const grade = 1;

      nock(votes.VOTES_API)
        .put(`/v1/grades/${post}`, { user: user, grade: 1 })
        .reply(500, {
          error: 'Internal server error'
        });

      let error = null;
      try {
        await votes.addGrade(post, user, grade);
      } catch (e) {
        error = e;
      }

      expect(error).not.toBe(null);
    });
  });
});
