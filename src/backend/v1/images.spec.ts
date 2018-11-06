import mockFs from 'mock-fs';
import * as images from './images';
import nock from 'nock';
import fs from 'fs';
import { promisify } from 'util';
import flushPromises from 'flush-promises';
import { mockRes } from 'sinon-express-mock';

const { WritableMock } = require('stream-mock');

const statAsync = promisify(fs.stat);

afterEach(() => {
  mockFs.restore();
});

describe('v1/images', () => {
  describe('uploadImages', () => {
    it('should upload the given images to the images-api', async () => {
      const filePath = `${__dirname}/test.png`;
      const filePath2 = `${__dirname}/test2.png`;
      const filePaths = [filePath, filePath2];
      const postId = 'lskdfasdf';

      mockFs({
        [filePath]: 'content',
        [filePath2]: 'content'
      });

      let parsedBody: string = '';
      nock(images.IMAGES_API)
        .put(`/v1/images/${postId}`, (body: any) => {
          parsedBody = body;
          return body;
        })
        .reply(200, { success: true });

      await images.uploadImages(postId, filePaths);
      mockFs.restore();
      expect(parsedBody.split('Content-Type: image/png').length - 1).toBe(2);
    });

    it('should throw on api error', async () => {
      const filePath = `${__dirname}/test.png`;
      const filePaths = [filePath];
      const postId = 'lskdfasdf';

      mockFs({
        [filePath]: 'content'
      });

      let parsedBody = null;
      nock(images.IMAGES_API)
        .put(`/v1/images/${postId}`, (body: any) => {
          parsedBody = body;
          return body;
        })
        .reply(500, { error: 'Internal server error' });

      let thrown = null;
      try {
        await images.uploadImages(postId, filePaths);
      } catch (e) {
        thrown = e;
      }
      mockFs.restore();
      expect(thrown).not.toBe(null);
    });

    it('should remove all given images from disk', async () => {
      const filePath = `${__dirname}/test.png`;
      const filePaths = [filePath];
      const postId = 'lskdfasdf';

      mockFs({
        [filePath]: 'content'
      });

      try {
        await images.uploadImages(postId, filePaths);
      } catch (_) {}

      let thrown = null;
      try {
        await statAsync(filePath);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
    });
  });

  describe('deleteImages', () => {
    it('should send a delete request to the images-api for the postId', async () => {
      const postId = 'sdfsdf';
      nock(images.IMAGES_API)
        .delete(`/v1/images/${postId}`)
        .reply(200, { success: true });

      await images.deleteImages(postId);
    });

    it('should throw on an api error', async () => {
      const postId = 'sdfsdf';
      nock(images.IMAGES_API)
        .delete(`/v1/images/${postId}`)
        .reply(500, { error: 'Internal server error' });

      let thrown = null;
      try {
        await images.deleteImages(postId);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).not.toBe(null);
    });

    it("should not throw if images don't exist", async () => {
      const postId = 'sdfsdf';
      nock(images.IMAGES_API)
        .delete(`/v1/images/${postId}`)
        .reply(404, { error: 'Not found' });

      let thrown = null;
      try {
        await images.deleteImages(postId);
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBe(null);
    });
  });

  describe('forwardImages', async () => {
    it('should forward image requests to image api', (done) => {
      const mockResponse = new WritableMock();

      const imageId = 1;
      const postId = 'asdfasdf';

      const responseFilePath = `${__dirname}/test.png`;

      mockFs({
        [responseFilePath]: 'filecontent'
      });

      nock(images.IMAGES_API)
        .get(`/v1/images/${postId}/${imageId}`)
        .reply(200, fs.createReadStream(responseFilePath));

      images.forwardRequest(postId, imageId, mockResponse as any);
      mockResponse.on('finish', () => {
        expect(mockResponse.data.toString()).toBe('filecontent');
        done();
      });
    });

    it('should respond error on connection error', async () => {
      const mockResponse = mockRes();

      const imageId = 1;
      const postId = 'asdfasdf';

      try {
        images.forwardRequest(postId, imageId, mockResponse as any);
      } catch (e) {
        // If an error is thrown, check that we were expecting that error (in tests)
        expect(e.message).toBe('dest.on is not a function');
      }

      await flushPromises();
      expect(mockResponse.status.calledWith(500)).toBe(true);
      expect(mockResponse.send.calledWith({ error: 'Internal server error' })).toBe(true);
    });
  });
});
