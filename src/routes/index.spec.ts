import supertest from 'supertest';
import app from '../app';

describe('routes', () => {
  describe('GET /', () => {
    it('responds with documentation', async () => {
      const response = await supertest(app).get('/');
      expect(response.body).toEqual({ v1: '/v1' });
    });
  });

  describe('Unrecognised route', () => {
    it('should respond with 404', async () => {
      const response = await supertest(app).get('/badroute');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });
  });
});
