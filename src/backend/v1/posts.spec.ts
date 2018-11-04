import * as posts from './posts';
import { mockReq, mockRes } from 'sinon-express-mock';
import nock from 'nock';
import flushPromises from 'flush-promises';

// tslint:disable-next-line:variable-name
const MockExpressRequest = require('mock-express-request');
const { WritableMock } = require('stream-mock');

describe('v1/posts', () => {
  describe('forwardGetPosts', () => {
    it('should foward the request with the given query', (done) => {
      const query = { approved: false };
      nock(posts.POSTS_API)
        .get('/v1/posts')
        .query(query)
        .reply(200, {
          posts: []
        });
      const response = new WritableMock();

      posts.forwardGetPosts(query, response as any);
      response.on('finish', () => {
        expect(response.data.toString()).toEqual(JSON.stringify({ posts: [] }));
        done();
      });

      // We will only respond when the query is equal to
      // the one given
      const query2 = { approved: true };
      const responseData = { posts: [
        { title: 'test', content: 'test', author: 'test' }
      ]};

      nock(posts.POSTS_API)
        .get('/v1/posts')
        .query(query2)
        .reply(200, responseData);

      const response2 = new WritableMock();

      posts.forwardGetPosts(query2, response2 as any);
      response2.on('finish', () => {
        expect(response2.data.toString()).toEqual(JSON.stringify(responseData));
        done();
      });
    });

    it('should respond with any errors from posts api', (done) => {
      const query = { approved: false };
      nock(posts.POSTS_API)
        .get('/v1/posts')
        .query(query)
        .reply(422, {
          error: 'Bad query'
        });
      const response = new WritableMock();

      posts.forwardGetPosts(query, response as any);
      response.on('finish', () => {
        expect(response.data.toString()).toEqual(JSON.stringify({ error: 'Bad query' }));
        done();
      });
    });

    it('should respond 500 on error', async () => {
      const query = { approved: false };
      const res = mockRes();

      try {
        posts.forwardGetPosts(query, res);
      } catch (e) {
        // If an error is thrown, check that we were expecting that error (in tests)
        expect(e.message).toBe('dest.on is not a function');
      }
      await flushPromises();
      expect(res.status.calledWith(500)).toBe(true);
      expect(res.send.calledWith({ error: 'Internal server error' })).toBe(true);
    });
  });

  describe('getPost', async () => {
    it('should call the correct posts api endpoint', async () => {
      const postId = 'sdfjafa';
      const mockResponse = {
        title: 'test',
        content: 'test'
      };

      nock(posts.POSTS_API)
        .get(`/v1/posts/${postId}`)
        .reply(200, mockResponse);

      const response = await posts.getPost(postId);
      expect(response).toEqual(mockResponse);
    });

    it('should throw an error on failure', async () => {
      const postId = 'sdfjafa';

      try {
        await posts.getPost(postId);
      } catch (e) {
        expect(e.message).toContain('No match for request');
      }
    });
  });

  describe('newPost', async () => {
    it('should post to the the correct posts api endpoint', async () => {
      const postData = {
        title: 'test',
        content: 'test',
        author: 'test'
      };
      const mockResponse = { id: 'test' };

      nock(posts.POSTS_API)
        .post('/v1/posts', postData)
        .reply(200, mockResponse);

      const id = await posts.newPost(postData);
      expect(id).toEqual(mockResponse.id);
    });

    it('should return post id from response', async () => {
      const postData = {
        title: 'test1',
        content: 'test1',
        author: 'test1'
      };
      const mockResponse = { id: 'wsdsdfasf' };

      nock(posts.POSTS_API)
        .post('/v1/posts', postData)
        .reply(200, mockResponse);

      const id = await posts.newPost(postData);
      expect(id).toEqual(mockResponse.id);
    });

    it('should throw an error on failure', async () => {
      const postId = 'sdfjafa';

      try {
        await posts.newPost(postId);
      } catch (e) {
        expect(e.message).toContain('No match for request');
      }
    });
  });

  describe('deletePost', async () => {
    it('should send delete to the the correct posts api endpoint', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { success: true };

      nock(posts.POSTS_API)
        .delete(`/v1/posts/${postId}`)
        .reply(200, mockResponse);

      await posts.deletePost(postId);
    });

    it("should not throw an error if post doesn't exist", async () => {
      const postId = 'fsdfsd';
      const mockResponse = { error: 'Not found' };

      nock(posts.POSTS_API)
        .delete(`/v1/posts/${postId}`)
        .reply(404, mockResponse);

      await posts.deletePost(postId);
    });

    it('should throw an error on failure', async () => {
      const postId = 'sdfasdf';
      try {
        await posts.deletePost(postId);
      } catch (e) {
        expect(e.message).toContain('No match for request');
      }
    });
  });

  describe('forwardRequest', async () => {
    it('should forward any request to the posts api', (done) => {
      const postId = 'fsdfsd';
      const mockResponse = { success: true };

      const req = new MockExpressRequest({
        url: `${posts.POSTS_API}/v1/posts/asdkfjasdf/approved`,
        method: 'PUT'
      });

      nock(posts.POSTS_API)
        .put('/v1/posts/asdkfjasdf/approved')
        .reply(200, mockResponse);

      const response = new WritableMock();

      posts.forwardRequest(req, response as any);
      response.on('finish', () => {
        expect(response.data.toString()).toEqual(JSON.stringify(mockResponse));
        done();
      });
    });

    it("should not throw an error if post doesn't exist", async () => {
      const postId = 'fsdfsd';
      const mockResponse = { error: 'Not found' };

      nock(posts.POSTS_API)
        .delete(`/v1/posts/${postId}`)
        .reply(404, mockResponse);

      await posts.deletePost(postId);
    });

    it('should throw an error on failure', async () => {
      const postId = 'sdfasdf';
      try {
        await posts.deletePost(postId);
      } catch (e) {
        expect(e.message).toContain('No match for request');
      }
    });
  });
});
