import requestPromise from 'request-promise';
import fs from 'fs';
import { Response } from 'express';

export const IMAGES_API = process.env.IMAGES_API || 'https://localhost:3923';

export async function uploadImages(postId: string, imagePaths: string[]) {
  const imageAttachments = [];
  for (const path of imagePaths) {
    imageAttachments.push(fs.createReadStream(path));
  }

  await requestPromise.post(`${IMAGES_API}/v1/images`, {
    formData: {
      id: postId,
      images: imageAttachments
    },
    json: true
  });
}

export async function deleteImages(postId: string) {
  try {
    await requestPromise.delete(`${IMAGES_API}/v1/images/${postId}`);
  } catch (e) {
    if (e.response && e.response.status !== 404) {
      throw e;
    }
  }
}

export async function forwardRequest(postId: string, imgId: string, res: Response) {
  requestPromise.get(`${IMAGES_API}/v1/images/${postId}/${imgId}`)
    .on('error', (e) => {
      res.status(500).send({ error: 'Internal server error' });
    }).pipe(res);
}
