import requestPromise from 'request-promise';
import request from 'request';
import fs from 'fs';
import { promisify } from 'util';
import { Response } from 'express';

const unlinkAsync = promisify(fs.unlink);

async function attemptRemoval(path: string) {
  try {
    await unlinkAsync(path);
  } catch (_) {}
}

export const IMAGES_API = process.env.IMAGES_API || 'http://localhost:3293';

/**
 * Upload the given image files, under the given post id
 * removing the files from disk, after upload
 */
export async function uploadImages(postId: string, imagePaths: string[]) {
  const imageAttachments = [];
  for (const path of imagePaths) {
    imageAttachments.push(fs.createReadStream(path));
  }
  let error = null;
  try {
    await requestPromise.put(`${IMAGES_API}/v1/store/${postId}`, {
      formData: {
        images: imageAttachments
      },
      json: true
    });
  } catch (e) {
    error = e;
  }

  // Remove files, even after failed upload
  const unlinks = [];
  for (const path of imagePaths) {
    unlinks.push(attemptRemoval(path));
  }
  await Promise.all(unlinks);

  if (error) {
    throw error;
  }
}

export async function deleteImages(postId: string) {
  try {
    await requestPromise.delete(`${IMAGES_API}/v1/store/${postId}`);
  } catch (e) {
    if (!e.statusCode || e.statusCode !== 404) {
      throw e;
    }
  }
}

export function forwardRequest(postId: string, imgId: number, res: Response) {
  const response = request.get(`${IMAGES_API}/v1/store/${postId}/${imgId}`, (err, res) => {});
  // request.catch(() => {});

  // Any real request errors should throw internal server error
  response.on('error', (e) => {
    res.status(500).send({ error: 'Internal server error' });
  });

  response.pipe(res);
}
