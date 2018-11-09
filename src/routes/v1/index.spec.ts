import supertest from 'supertest';
import app from '../../app';

describe('/v1', () => {
  describe('GET /', () => {
    it('responds with documentation', async () => {
      const response = await supertest(app).get('/v1');
      expect(response.body).toEqual({
        posts: '/posts',
        me: '/me',
        users: '/accounts'
      });
    });
  });
});
