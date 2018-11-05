import * as posts from './posts';
import nock from 'nock';

describe('v1/posts', () => {
  describe('getPosts', () => {
    it('should request posts with the given query', async () => {
      const query = { approved: false };
      nock(posts.POSTS_API)
        .get('/v1/posts')
        .query(query)
        .reply(200, {
          posts: []
        });

      const response = await posts.getPosts(query);
      expect(response).toEqual([]);
    });

    it('should throw an error on bad response', async () => {
      const query = { approved: false };
      nock(posts.POSTS_API)
        .get('/v1/posts')
        .query(query)
        .reply(422, {
          error: 'Bad query'
        });

      let thrown = null;
      try {
        await posts.getPosts(query);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
    });

    it('should should return posts list', async () => {
      // We will only respond when the query is equal to
      // the one given
      const query = { approved: true };
      const responseData = { posts: [
        { title: 'test', content: 'test', author: 'test' }
      ]};

      nock(posts.POSTS_API)
        .get('/v1/posts')
        .query(query)
        .reply(200, responseData);

      const response = await posts.getPosts(query);
      expect(response).toEqual(responseData.posts);
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
      let thrown = null;
      try {
        await posts.deletePost(postId);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).not.toBe(null);
      expect(thrown.message).toContain('No match for request');
    });
  });

  describe('setPostPinned', async () => {
    it('should send put request to the correct posts api', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { success: true };

      nock(posts.POSTS_API)
        .put(`/v1/posts/${postId}/pinned`, { pinned: true })
        .reply(200, mockResponse);

      const success = await posts.setPostPinned(postId, true);
      expect(success).toBe(true);
    });

    it('should send the correct body in the request', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { success: true };

      nock(posts.POSTS_API)
        .put(`/v1/posts/${postId}/pinned`, { pinned: false })
        .reply(200, mockResponse);

      const success = await posts.setPostPinned(postId, false);
      expect(success).toBe(true);
    });

    it('should throw an error on bad request', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { error: 'Not found' };

      nock(posts.POSTS_API)
        .put(`/v1/posts/${postId}/pinned`)
        .reply(404, mockResponse);

      let thrown = null;
      try {
        await posts.setPostPinned(postId, false);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
      expect(thrown.statusCode).toBe(404);
      expect(thrown.response.body).toEqual(mockResponse);
    });

    it('should thrown an error on connection failure', async () => {
      const postId = 'fsdfsd';

      let thrown = null;
      try {
        await posts.setPostPinned(postId, false);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
      expect(thrown.statusCode).toBe(undefined);
    });
  });

  describe('setPostApproval', async () => {
    it('should send put request to the correct posts api', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { success: true };

      nock(posts.POSTS_API)
        .put(`/v1/posts/${postId}/approved`, { approved: true })
        .reply(200, mockResponse);

      const success = await posts.setPostApproval(postId, true);
      expect(success).toBe(true);
    });

    it('should send the correct body in the request', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { success: true };

      nock(posts.POSTS_API)
        .put(`/v1/posts/${postId}/approved`, { approved: false })
        .reply(200, mockResponse);

      const success = await posts.setPostApproval(postId, false);
      expect(success).toBe(true);
    });

    it('should throw an error on bad request', async () => {
      const postId = 'fsdfsd';
      const mockResponse = { error: 'Not found' };

      nock(posts.POSTS_API)
        .put(`/v1/posts/${postId}/approved`)
        .reply(404, mockResponse);

      let thrown = null;
      try {
        await posts.setPostApproval(postId, false);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
      expect(thrown.statusCode).toBe(404);
    });

    it('should thrown an error on connection failure', async () => {
      const postId = 'fsdfsd';

      let thrown = null;
      try {
        await posts.setPostApproval(postId, false);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
      expect(thrown.statusCode).toBe(undefined);
    });
  });
});
