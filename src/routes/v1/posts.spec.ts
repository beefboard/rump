import supertest from 'supertest';
import app from '../../app';
import mockFs from 'mock-fs';
import fs from 'fs';
import { promisify } from 'util';
import { UPLOAD_DIR } from './posts';

const readdirAsync = promisify(fs.readdir);

const images = require('../../backend/v1/images');
jest.mock('../../backend/v1/images');

const posts = require('../../backend/v1/posts');
jest.mock('../../backend/v1/posts');

const accounts = require('../../auth/accounts');
jest.mock('../../auth/accounts');

const votes = require('../../backend/v1/votes');
jest.mock('../../backend/v1/votes');

console.error = () => {};

afterEach(() => {
  mockFs.restore();
});

describe('/v1/posts', () => {
  describe('GET /', async () => {
    it('should return posts from posts api with query', async () => {
      posts.getPosts.mockImplementation(() => {
        return [{
          title: 'test',
          id: 'asdassdf'
        }];
      });

      votes.getGrades.mockImplementation(() => {
        return {
          asdassdf: { grade: 1 }
        };
      });

      const mockQuery = {
        page: '10'
      };

      const response = await supertest(app)
        .get('/v1/posts')
        .query(mockQuery);

      expect(posts.getPosts).toHaveBeenCalledWith(mockQuery);
      expect(votes.getGrades).toHaveBeenCalledWith(['asdassdf'], undefined);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        posts:[
          { title: 'test', id: 'asdassdf', votes: { grade: 1 } }
        ]
      });
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
          id: 'asdasd',
          title: 'test'
        }];
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      votes.getGrades.mockImplementation(() => {
        return {
          asdasd: { grade: 1 }
        };
      });

      const mockQuery = {
        approved: 'false'
      };

      const response = await supertest(app)
        .get('/v1/posts')
        .set('x-access-token', 'safds')
        .query(mockQuery);

      expect(votes.getGrades).toHaveBeenCalledWith(['asdasd'], 'test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        posts: [
          { title: 'test', id: 'asdasd', votes: { grade: 1 } }
        ]
      });
    });

    it('should respond 500 error when api fails', async () => {
      posts.getPosts.mockImplementation(() => {
        throw new Error('Connection errro');
      });

      const response = await supertest(app)
        .get('/v1/posts');

      expect(response.status).toBe(500);

      posts.getPosts.mockImplementation(() => {
        return [{
          id: 'test',
        }];
      });

      votes.getGrades.mockImplementation(() => {
        throw new Error('Error');
      });

      const response2 = await supertest(app)
        .get('/v1/posts');

      expect(response2.status).toBe(500);
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

  describe('GET /:postId', () => {
    it('should respond with details of the given post and post votes', async () => {
      posts.getPost.mockImplementation(() => {
        return {
          title: 'test'
        };
      });

      votes.getGrade.mockImplementation(() => {
        return { grade: 1 };
      });

      const response = await supertest(app)
        .get('/v1/posts/adfasdfj');

      expect(posts.getPost).toHaveBeenCalledWith('adfasdfj');
      expect(votes.getGrade).toHaveBeenCalledWith('adfasdfj', undefined);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ title: 'test', votes: { grade: 1 } });
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

      votes.getGrade.mockImplementation(() => {
        return { grade: 1 };
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
      expect(response.body).toEqual({ title: 'test', approved: false, votes: { grade: 1 } });
    });

    it('should request post grade for username when logged in', async () => {
      posts.getPost.mockImplementation(() => {
        return {
          title: 'test',
          approved: false
        };
      });

      votes.getGrade.mockImplementation(() => {
        return { grade: 1 };
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

      expect(votes.getGrade).toHaveBeenCalledWith('sdfsadf', 'test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ title: 'test', approved: false, votes: { grade: 1 } });
    });

    it('should respond with a 500 error on api failure', async () => {
      posts.getPost.mockImplementation(() => {
        throw new Error('Connection error');
      });

      const response = await supertest(app)
        .get('/v1/posts/sdfsadf');

      expect(response.status).toBe(500);

      votes.getGrade.mockImplementation(() => {
        throw new Error('Connection error');
      });

      const response2 = await supertest(app)
        .get('/v1/posts/sdfsadf');

      expect(response2.status).toBe(500);
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

  describe('POST /:postId/votes', () => {
    it('should respond with unauthorised for guests', async () => {
      const response = await supertest(app)
        .post('/v1/posts/adsfsda/votes')
        .send({
          grade: 1
        });

      expect(response.status).toBe(401);
    });

    it('should add a grade to the postId', async () => {
      votes.addGrade.mockImplementation(() => {
        return true;
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'testsd'
        };
      });

      const response = await supertest(app)
        .post('/v1/posts/adsfsda/votes')
        .set('x-access-token', 'token')
        .send({
          grade: 1
        });

      expect(votes.addGrade).toHaveBeenCalledWith('adsfsda', 'testsd', 1);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should respond with error from api', async () => {
      votes.addGrade.mockImplementation(() => {
        throw {
          statusCode: 422,
          response: {
            body: {
              error: 'An error'
            }
          }
        };
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'testsd'
        };
      });

      const response = await supertest(app)
        .post('/v1/posts/adsfsda/votes')
        .set('x-access-token', 'token')
        .send({
          grade: 1
        });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'An error' });

      votes.addGrade.mockImplementation(() => {
        throw {
          statusCode: 500,
          response: {
            body: {
              error: 'Internal server error'
            }
          }
        };
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'testsd'
        };
      });

      const response2 = await supertest(app)
        .post('/v1/posts/adsfsda/votes')
        .set('x-access-token', 'token')
        .send({
          grade: 1
        });

      expect(response2.status).toBe(500);
      expect(response2.body).toEqual({ error: 'Internal server error' });
    });

    it('should respond with 500 on internal error', async () => {
      votes.addGrade.mockImplementation(() => {
        throw new Error('Error');
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'testsd'
        };
      });

      const response = await supertest(app)
        .post('/v1/posts/adsfsda/votes')
        .set('x-access-token', 'token')
        .send({
          grade: 1
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
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
    it('should respond with 401 for non logged in users', async () => {
      const response = await supertest(app)
        .post('/v1/posts');

      expect(response.status).toBe(401);
    });

    it('should send correct post creation details to posts api', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.newPost.mockImplementation(() => {
        return true;
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content');

      expect(posts.newPost).toHaveBeenCalledWith({
        title: 'test',
        content: 'content',
        author: 'test',
        numImages: 0
      });

      expect(response.status).toBe(200);
    });

    it('should respond with 500 error on post api failures', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.newPost.mockImplementation(() => {
        throw new Error('Failure');
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content');

      expect(response.status).toBe(500);
    });

    it('should upload any attached images to the images api', async () => {
      mockFs({
        '/image.png': 'content',
        '/image2.png': 'content',
        [UPLOAD_DIR]: {}
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content')
        .attach('images', '/image.png')
        .attach('images', '/image2.png');

      expect(images.uploadImages).toHaveBeenCalled();
    });

    it('should return post id on success', async () => {
      mockFs({
        '/image.png': 'content',
        '/image2.png': 'content',
        [UPLOAD_DIR]: {}
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.newPost.mockImplementation(() => {
        return 'testid';
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content')
        .attach('images', '/image.png')
        .attach('images', '/image2.png');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'testid' });
    });

    it('should return 500 if image uploading fails', async () => {
      // Don't provide upload storage so test fails
      mockFs({
        '/image.png': 'content',
        '/image2.png': 'content'
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content')
        .attach('images', '/image.png')
        .attach('images', '/image2.png');

      expect(response.status).toBe(500);
    });

    it('should return 500 if apis fail', async () => {
      mockFs({
        '/image.png': 'content',
        '/image2.png': 'content',
        [UPLOAD_DIR]: {}
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.newPost.mockImplementation(() => {
        throw new Error('Some error');
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content')
        .attach('images', '/image.png')
        .attach('images', '/image2.png');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should return any error response from api', async () => {
      mockFs({
        '/image.png': 'content',
        '/image2.png': 'content',
        [UPLOAD_DIR]: {}
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      images.uploadImages.mockImplementation(() => {
        throw {
          statusCode: 422,
          response: {
            body: {
              error: 'An error'
            }
          }
        };
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content')
        .attach('images', '/image.png')
        .attach('images', '/image2.png');

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'An error' });

    });

    it('should always delete files from disk, even after api errors', async () => {
      mockFs({
        '/image.png': 'content',
        '/image2.png': 'content',
        [UPLOAD_DIR]: {}
      });

      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      images.uploadImages.mockImplementation(() => {
        throw {
          statusCode: 422,
          response: {
            body: {
              error: 'An error'
            }
          }
        };
      });

      const response = await supertest(app)
        .post('/v1/posts')
        .set('x-access-token', 'token')
        .field('title', 'test')
        .field('content', 'content')
        .attach('images', '/image.png')
        .attach('images', '/image2.png');

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'An error' });

      // Files are gone if upload dir is empty
      expect((await readdirAsync(UPLOAD_DIR)).length).toBe(0);
    });
  });

  describe('DELETE /:postId', () => {
    it('should respond 401 if not logged in', async () => {
      const response = await supertest(app)
        .delete('/v1/posts/asdaf');

      expect(response.status).toBe(401);
    });

    it('should respond 404 if post does not exist', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.getPost.mockImplementation(() => {
        return null;
      });

      const response = await supertest(app)
        .delete('/v1/posts/fsdfd')
        .set('x-access-token', 'token');

      expect(response.status).toBe(404);
    });

    it('should not allow post to be deleted by anyone', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'someuser',
          admin: false
        };
      });

      posts.getPost.mockImplementation(() => {
        return {
          id: 'asdfsdf',
          author: 'test',
          title: 'test3',
          content: 'test4'
        };
      });

      const response = await supertest(app)
        .delete('/v1/posts/afsdf')
        .set('x-access-token', 'token');

      expect(response.status).toBe(403);
    });

    it('should allow admins to delete any post', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'someuser',
          admin: true
        };
      });

      posts.getPost.mockImplementation(() => {
        return {
          id: 'sdfsdaf',
          author: 'test',
          title: 'test3',
          content: 'test4'
        };
      });

      const response = await supertest(app)
        .delete('/v1/posts/afsdf')
        .set('x-access-token', 'token');

      expect(response.status).toBe(200);
    });

    it('should allow post authors to delete their posts', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'someuser',
          admin: true
        };
      });

      posts.getPost.mockImplementation(() => {
        return {
          author: 'someuser',
          title: 'test3',
          content: 'test4'
        };
      });

      const response = await supertest(app)
        .delete('/v1/posts/afsdf')
        .set('x-access-token', 'token');

      expect(response.status).toBe(200);
    });

    it('should send delete request to posts api and images api', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'someuser',
          admin: true
        };
      });

      posts.getPost.mockImplementation(() => {
        return {
          author: 'someuser',
          title: 'test3',
          content: 'test4'
        };
      });

      await supertest(app)
        .delete('/v1/posts/afsdf')
        .set('x-access-token', 'token');

      expect(posts.deletePost).toHaveBeenCalledWith('afsdf');
      expect(images.deleteImages).toHaveBeenCalledWith('afsdf');
    });

    it('should respond with 500 error on posts api error', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'someuser',
          admin: true
        };
      });

      posts.getPost.mockImplementation(() => {
        return {
          author: 'someuser',
          title: 'test3',
          content: 'test4'
        };
      });

      posts.deletePost.mockImplementation(() => {
        throw new Error('An error');
      });

      const response = await supertest(app)
        .delete('/v1/posts/afsdf')
        .set('x-access-token', 'token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should respond with any errors from any apis', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'someuser',
          admin: true
        };
      });

      posts.getPost.mockImplementation(() => {
        return {
          author: 'someuser',
          title: 'test3',
          content: 'test4'
        };
      });

      posts.deletePost.mockImplementation(() => {
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
        .delete('/v1/posts/afsdf')
        .set('x-access-token', 'token');

      expect(response.status).toBe(422);
      expect(response.body).toEqual({ error: 'Some error' });
    });
  });

  describe('PUT /:postId/approved', () => {
    it('should respond with 403 for non-admins', async () => {
      const response = await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .send({
          approved: true
        });

      expect(response.status).toBe(403);
    });

    it('should send approval setting to posts api', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .set('x-access-token', 'token')
        .send({
          approved: true
        });

      expect(posts.setPostApproval).toHaveBeenCalledWith('afsdf', true);
    });

    it('should respond 200 on success', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.setPostApproval.mockImplementation(() => {
        return true;
      });

      const response = await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .set('x-access-token', 'token')
        .send({
          approved: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should respond 500 on api failure', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.setPostApproval.mockImplementation(() => {
        throw new Error('Random error');
      });

      const response = await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .set('x-access-token', 'token')
        .send({
          approved: true
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should respond with any errors from api', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.setPostApproval.mockImplementation(() => {
        throw {
          statusCode: 404,
          response: {
            body: {
              error: 'Not found'
            }
          }
        };
      });

      const response = await supertest(app)
        .put('/v1/posts/afsdf/approved')
        .set('x-access-token', 'token')
        .send({
          approved: true
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });
  });

  describe('PUT /:postId/pinned', () => {
    it('should respond with 403 for non-admins', async () => {
      const response = await supertest(app)
        .put('/v1/posts/afsdf/pinned')
        .send({
          pinned: true
        });

      expect(response.status).toBe(403);
    });
    it('should send approval setting to posts api', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      await supertest(app)
        .put('/v1/posts/afsdf/pinned')
        .set('x-access-token', 'token')
        .send({
          pinned: true
        });

      expect(posts.setPostPinned).toHaveBeenCalledWith('afsdf', true);
    });

    it('should respond 200 on success', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.setPostPinned.mockImplementation(() => {
        return true;
      });

      const response = await supertest(app)
        .put('/v1/posts/afsdf/pinned')
        .set('x-access-token', 'token')
        .send({
          pinned: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should respond 500 on api failure', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.setPostPinned.mockImplementation(() => {
        throw new Error('Random error');
      });

      const response = await supertest(app)
        .put('/v1/posts/afsdf/pinned')
        .set('x-access-token', 'token')
        .send({
          pinned: true
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should respond with any errors from api', async () => {
      accounts.getSession.mockImplementation(() => {
        return {
          username: 'test',
          admin: true
        };
      });

      posts.setPostPinned.mockImplementation(() => {
        throw {
          statusCode: 404,
          response: {
            body: {
              error: 'Not found'
            }
          }
        };
      });

      const response = await supertest(app)
        .put('/v1/posts/afsdf/pinned')
        .set('x-access-token', 'token')
        .send({
          pinned: true
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });
  });
});
