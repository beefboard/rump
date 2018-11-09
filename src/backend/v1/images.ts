import requestPromise from 'request-promise';
import fs from 'fs';
import { promisify } from 'util';
import { Response } from 'express';

const unlinkAsync = promisify(fs.unlink);

async function attemptRemoval(path: string) {
  try {
    await unlinkAsync(path);
  } catch (_) {}
}

export const IMAGES_API = process.env.IMAGES_API || 'https://localhost:3923';

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
    await requestPromise.put(`${IMAGES_API}/v1/images/${postId}`, {
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
    await requestPromise.delete(`${IMAGES_API}/v1/images/${postId}`);
  } catch (e) {
    if (!e.statusCode || e.statusCode !== 404) {
      throw e;
    }
  }
}

export function forwardRequest(postId: string, imgId: number, res: Response) {
  const request = requestPromise.get(`${IMAGES_API}/v1/images/${postId}/${imgId}`);
  // Catch any promise errors
  request.then(() => {});

  // Any real request errors should throw internal server error
  request.on('error', (e) => {
    res.status(500).send({ error: 'Internal server error' });
  });
  request.pipe(res);
}
