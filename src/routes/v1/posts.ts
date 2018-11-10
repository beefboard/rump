import { Router, Response } from 'express';
import * as posts from '../../backend/v1/posts';
import { guard, adminGuard } from '../../session';
import { AuthSession } from '../../auth/db/db';
import multer from 'multer';
import fs from 'fs';
import * as images from '../../backend/v1/images';

const autoReap = require('multer-autoreap');

// Create a place to temp store uploaded files
export const UPLOAD_DIR = process.env.IMG_STORE || `${__dirname}/../../../tmpimages`;
try {
  fs.mkdirSync(UPLOAD_DIR);
} catch (_) {}

const TEN_MB = 1024 * 1024 * 10;

// Max file size is expected to be 10 MB, but
// another custom size could also be used
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMG_SIZE || TEN_MB.toString(), 10);
const MAX_IMAGES = 5;

const upload = multer({
  dest: UPLOAD_DIR,
  fileFilter: (_, file, next) => {
    const type = file.mimetype;
    const typeArray = type.split('/');
    next(null, typeArray[0] === 'image');
  },
  limits: {
    fileSize: MAX_FILE_SIZE
  }
}).array('images', MAX_IMAGES);

const router = Router();

function handleError(e: any, res: Response) {
  console.error(e.message);
  if (e.statusCode) {
    res.status(e.statusCode);
    if (e.response && e.response.body) {
      res.send(e.response.body);
    } else {
      res.end();
    }
  } else {
    res.status(500).send({
      error: 'Internal server error'
    });
  }
}

router.get('/', async (req, res) => {
  const session = req.session;
  const query = req.query as posts.PostsQuery;

  // If the user has requested for unapproved posts
  if (query && query.approved != null && query.approved.toString() === 'false') {
    // The user is not admin, so return none
    if (!session || !session.admin) {
      return res.send({ posts: [] });
    }
  }
  try {
    const postsList = await posts.getPosts(query);
    res.send({ posts: postsList });
  } catch (e) {
    handleError(e, res);
  }
});

router.get('/:postId', async (req, res) => {
  const postId = req.params.postId;
  const session = req.session;
  try {
    const post = await posts.getPost(postId);
    // Don't allow post to be seen if we are not admin
    // and it has not been approved
    if (!post || !session
      || (!post.approved && !session.admin
          && post.author !== session.username)) {
      return res.status(404).send({ error: 'Not found' });
    }
    res.send(post);
  } catch (e) {
    handleError(e, res);
  }
});

router.get('/:postId/images/:imageId', async (req, res) => {
  const postId = req.params.postId;
  const imageId = req.params.imageId;
  images.forwardRequest(postId, imageId, res);
});

router.delete('/:postId', guard, async (req, res) => {
  const session = req.session as AuthSession;

  const postId = req.params.postId;
  try {
    const post = await posts.getPost(postId);
    if (!post) {
      return res.status(404).send({ error: 'Not found' });
    }

    // Cannot delete posts if you are not the owner, or you are not admin
    if (post.author !== session.username && !session.admin) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    await Promise.all([
      posts.deletePost(postId),
      images.deleteImages(postId)
    ]);
    res.send({ success: true });
  } catch (e) {
    handleError(e, res);
  }
});

router.post('/', guard, (req, res) => {
  // Upload, but autoremove leftover
  // files from disk
  upload(req, res, (err) => {
    autoReap(req, res, async () => {
      if (err) {
        return handleError(err, res);
      }
      const session = req.session as AuthSession;

      const title = req.body.title;
      const content = req.body.content;
      const author = session.username;

      const imagePaths = [];
      for (const file of req.files as any[]) {
        imagePaths.push(file.path);
      }

      try {
        const id = await posts.newPost({
          title: title,
          content: content,
          author: author,
          numImages: imagePaths.length
        });

        // Only upload images if we were given any
        if (imagePaths.length > 0) {
          await images.uploadImages(id, imagePaths);
        }
        res.send({ success: true });
      } catch (e) {
        handleError(e, res);
      }
    });
  });
});

router.put('/:postId/approved', adminGuard, async (req, res) => {
  const postId = req.params.postId;
  const approved = req.body.approved === true;

  try {
    const success = await posts.setPostApproval(postId, approved);
    res.send({ success: success });
  } catch (e) {
    handleError(e, res);
  }
});

router.put('/:postId/pinned', adminGuard, async (req, res) => {
  const postId = req.params.postId;
  const pinned = req.body.pinned === true;

  try {
    const success = await posts.setPostPinned(postId, pinned);
    res.send({ success: success });
  } catch (e) {
    handleError(e, res);
  }
});

export default router;
