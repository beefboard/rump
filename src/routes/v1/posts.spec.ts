import supertest from 'supertest';
import app from '../../app';

const images = require('../../backend/v1/images');
jest.mock('../../backend/v1/images');

const posts = require('../../backend/v1/posts');
jest.mock('../../backend/v1/posts');

const accounts = require('../../auth/accounts');
jest.mock('../../auth/accounts');

console.error = () => {};

afterAll(() => {
  posts.getPosts.mockReset();
  posts.getPost.mockReset();
  posts.setPostApproval.mockReset();

  images.forwardRequest.mockReset();
});

describe('/v1/posts', () => {
  describe('GET /', async () => {
    it('should return posts from posts api with query', async () => {
      posts.getPosts.mockImplementation(() => {
        return [{
          title: 'test'
        }];
      });

      const mockQuery = {
        page: '10'
      };

      const response = await supertest(app)
        .get('/v1/posts')
        .query(mockQuery);

      expect(posts.getPosts).toHaveBeenCalledWith(mockQuery);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ posts:[{ title: 'test' }] });
    });

    it('should not allow non-admins to query for unapproved', async () => {
      posts.getPosts.mockReset();
      posts.getPosts.mockImplementation(() => {
        return [{
          title: 'test'
        }];
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: false
        };
      });

      const mockQuery = {
        approved: 'false'
      };

      const response = await supertest(app)
        .get('/v1/posts')
        .set('x-access-token', 'safds')
        .query(mockQuery);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ posts:[] });
    });

    it('should allow admins to query unapproved posts', async () => {
      posts.getPosts.mockImplementation(() => {
        return [{
          title: 'test'
        }];
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      const mockQuery = {
        approved: 'false'
      };

      const response = await supertest(app)
        .get('/v1/posts')
        .set('x-access-token', 'safds')
        .query(mockQuery);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ posts: [{ title: 'test' }] });
    });

    it('should respond 500 error when api fails', async () => {
      posts.getPosts.mockImplementation(() => {
        throw new Error('Connection errro');
      });

      const response = await supertest(app)
        .get('/v1/posts');

      expect(response.status).toBe(500);
    });

    it('should return the http error from the api', async () => {
      posts.getPosts.mockImplementation(() => {
        throw {
          statusCode: 422,
          body: {
            error: 'Connection error'
          }
        };
      });

      const response = await supertest(app)
        .get('/v1/posts');

      expect(response.status).toBe(422);
    });
  });

  describe('GET /:id', () => {
    it('should respond with details of the given post', async () => {
      posts.getPost.mockImplementation(() => {
        return {
          title: 'test'
        };
      });

      const response = await supertest(app)
        .get('/v1/posts/adfasdfj');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ title: 'test' });
    });

    it('should respond 404 for posts which don\'t exist', async () => {
      posts.getPost.mockImplementation(() => {
        return null;
      });

      const response = await supertest(app)
        .get('/v1/posts/adfasdfj');

      expect(response.status).toBe(404);
    });

    it('should not allow non-admins to access unapproved posts', async () => {
      posts.getPost.mockImplementation(() => {
        return {
          title: 'test',
          approved: false
        };
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: false
        };
      });

      const mockQuery = {
        approved: 'false'
      };

      const response = await supertest(app)
        .get('/v1/posts/sdfsadf')
        .set('x-access-token', 'safds')
        .query(mockQuery);

      expect(response.status).toBe(404);
    });

    it('should allow admins to access unapproved posts', async () => {
      posts.getPost.mockImplementation(() => {
        return {
          title: 'test',
          approved: false
        };
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      const response = await supertest(app)
        .get('/v1/posts/sdfsadf')
        .set('x-access-token', 'safds');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ title: 'test', approved: false });
    });

    it('should respond with a 500 error on api failure', async () => {
      posts.getPost.mockImplementation(() => {
        throw new Error('Connection error');
      });

      const response = await supertest(app)
        .get('/v1/posts/sdfsadf');

      expect(response.status).toBe(500);
    });

    it('should respond with any error received from api', async () => {
      posts.getPost.mockImplementation(() => {
        throw {
          statusCode: 422,
          response: {
            body: {
              error: 'Some error'
            }
          }
        };
      });

      const response = await supertest(app)
        .get('/v1/posts/sdfsadf');

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'Some error' });
    });
  });

  describe('GET /:postId/images/:imageId', () => {
    it('should forward the image request to the images api', async () => {
      images.forwardRequest.mockImplementation((postId: any, imageId: any, res: any) => {
        res.send('imagecontent');
      });
      const response = await supertest(app)
        .get('/v1/posts/asdfasf/images/0');

      expect(images.forwardRequest).toHaveBeenCalledWith('asdfasf', '0', expect.anything());

      expect(response.status).toBe(200);
      expect(response.text).toBe('imagecontent');
    });
  });

  describe('POST /', () => {
  });

  describe('PUT /:id/approved', () => {
    it('should respond with 403 for non-admins', async () => {
      const response = await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .send({
          approved: true
        });

      expect(response.status).toBe(403);
    });
    it('should send approval setting to posts api', async () => {
      const response = await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .send({
          approved: true
        });

      expect(posts.setPostApproval).toHaveBeenCalledWith(true);
    });
  });
});
