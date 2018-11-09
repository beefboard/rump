import supertest from 'supertest';
import app from '../../app';
const accounts = require('../../auth/accounts');

jest.mock('../../auth/accounts');

console.error = () => {};

describe('/v1/me', () => {
  describe('GET /', () => {
    it('should return session details session decoder', async () => {
      const mockSessionDetails = {
        username: 'test',
        firstName: 'test',
        lastName: 'test',
        admin: true,
        token: 'sdafasdfsdf'
      };

      accounts.getSession.mockImplementation(() => {
        return mockSessionDetails;
      });

      const response = await supertest(app)
        .get('/v1/me')
        .set('x-access-token', 'sadfasfd');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSessionDetails);
    });

    it('should return 401 when guard does not detect session', async () => {
      const response = await supertest(app).get('/v1/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /', () => {

    it('should call login on accounts with username and password given', async () => {
      await supertest(app)
        .put('/v1/me')
        .send({
          username: 'username1',
          password: 'password4'
        });

      expect(accounts.login).toHaveBeenCalledWith('username1', 'password4');
    });
    it('should return token when username and password correct', async () => {
      const mockToken = 'sdfsdfd';

      accounts.login.mockImplementation(() => {
        return mockToken;
      });

      const response = await supertest(app)
        .put('/v1/me')
        .send({
          username: 'username',
          password: 'password'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: mockToken });
    });

    it('should return 401 when credentials are are incorrect', async () => {
      accounts.login.mockImplementation(() => {
        return null;
      });

      const response = await supertest(app)
        .put('/v1/me')
        .send({
          username: 'username',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    it('should return 422 when missing username or password', async () => {
      const response = await supertest(app)
        .put('/v1/me')
        .send({
          username: 'username'
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'username and password must be provided' });
    });

    it('should return 500 when login fails', async () => {
      accounts.login.mockImplementation(() => {
        throw new Error('Failed');
      });

      const response = await supertest(app)
        .put('/v1/me')
        .send({
          username: 'username',
          password: 'password'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('DELETE /', async () => {
    it('should call logout with the session token', async () => {
      const mockToken = 'sadfasfd';
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          token: mockToken
        };
      });
      await supertest(app)
        .delete('/v1/me')
        .set('x-access-token', mockToken);

      expect(accounts.logout).toHaveBeenCalledWith(mockToken);
    });

    it('should return success after logout', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          token: 'test'
        };
      });
      const response = await supertest(app)
        .delete('/v1/me')
        .set('x-access-token', 'test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });
});
