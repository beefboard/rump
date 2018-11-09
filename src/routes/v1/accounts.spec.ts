import supertest from 'supertest';
import app from '../../app';
const accounts = require('../../auth/accounts');

jest.mock('../../auth/accounts');

console.error = () => {};

describe('/v1/accounts', () => {
  describe('POST /', () => {
    it('should create an account with the given details, and respond with success' , async () => {
      accounts.register.mockImplementation(() => {
        return true;
      });
      const response = await supertest(app)
        .post('/v1/accounts')
        .send({
          username: 'test',
          password: 'test',
          email: 'test@test.com',
          firstName: 'test',
          lastName: 'test'
        });

      expect(accounts.register).toBeCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should respond with 422 when details are missing', async () => {
      accounts.register.mockImplementation(() => {
        return true;
      });
      const response = await supertest(app)
        .post('/v1/accounts')
        .send({
          username: 'test',
          email: 'test@test.com',
          firstName: 'test',
          lastName: 'test'
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'Invalid data' });
    });

    it('should respond with 422 when email is invalid', async () => {
      accounts.register.mockImplementation(() => {
        return false;
      });
      const response = await supertest(app)
        .post('/v1/accounts')
        .send({
          username: 'test',
          password: 'test',
          email: 'test@com',
          firstName: 'test',
          lastName: 'test'
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'Bad details' });
    });

    it('should respond with 500 on registration error', async () => {
      accounts.register.mockImplementation(() => {
        throw new Error('bad');
      });
      const response = await supertest(app)
        .post('/v1/accounts')
        .send({
          username: 'test',
          password: 'test',
          email: 'test@com',
          firstName: 'test',
          lastName: 'test'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('GET /:username', () => {
    it('should respond with userdetails of the given user', async () => {
      const mockuserResponse = {
        username: 'test',
        email: 'test@test.com',
        firstName: 'name',
        lastName: 'last',
        admin: false
      };

      accounts.getUser.mockImplementation(() => {
        return mockuserResponse;
      });

      const response = await supertest(app)
        .get('/v1/accounts/test');

      expect(accounts.getUser).toBeCalledWith(mockuserResponse.username);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockuserResponse);
    });

    it('should respond 404 for a user which does not exist', async () => {
      accounts.getUser.mockImplementation(() => {
        return null;
      });

      const response = await supertest(app)
        .get('/v1/accounts/tsdfsdf');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('should respond 500 when unable to fetch data', async () => {
      accounts.getUser.mockImplementation(() => {
        throw new Error('an error');
      });

      const response = await supertest(app)
        .get('/v1/accounts/tsdfsdf');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });
});
