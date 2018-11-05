import { Router } from 'express';
import * as posts from '../../backend/v1/posts';
import { guard, adminGuard } from '../../session';
import { AuthSession } from '../../data/db/db';
import multer from 'multer';
import fs from 'fs';
import * as images from '../../backend/v1/images';

// Create a place to temp store uploaded files
const UPLOAD_DIR = `${__dirname}/../../tmpimages`;
try {
  fs.mkdirSync(UPLOAD_DIR);
} catch (_) {}

const upload = multer({
  dest: UPLOAD_DIR ,
  fileFilter: (_, file, next) => {
    const type = file.mimetype;
    const typeArray = type.split('/');
    next(null, typeArray[0] === 'image');
  }
});

const router = Router();

router.get('/', async (req, res) => {
  const session = req.session;
  const query = req.query as posts.PostsQuery;

  // If the user has requested for unapproved posts
  if (query && query.approved != null && query.approved === false) {
    // The user is not admin, so return none
    if (!session || session.admin === false) {
      return res.send({ posts: [] });
    }
  }
  posts.forwardGetPosts(query, res);
});

router.get('/:id', async (req, res) => {
  const postId = req.params.id;
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
    console.error(e);
    return res.status(500).send({ error: 'Internal server error' });
  }
});

router.get('/:postId/images/:imageId', async (req, res) => {
  const postId = req.params.postId;
  const imageId = req.params.imageId;
  images.forwardRequest(postId, imageId, res);
});

router.use(guard);

router.delete('/:id', async (req, res) => {
  const session = req.session as AuthSession;

  const postId = req.params.id;
  try {
    const post = await posts.getPost(postId);
    if (!post) {
      return res.status(404);
    }

    // Cannot delete posts if you are not the owner, or you are not admin
    if (post.author !== session.username && session.admin) {
      return res.status(403).send({ error: 'Forbidden' });
    }

    await posts.deletePost(postId);
    await images.deleteImages(postId);
    res.send({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Internal server error' });
  }
});

router.post('/', upload.array('images'), async (req, res) => {
  const session = req.session as AuthSession;

  const title = req.body.title;
  const content = req.body.content;
  const author = session.username;

  const imagePaths = [];
  for (const file of req.files as any[]) {
    imagePaths.push(file.path);
  }

  if (!title || !content) {
    return res.status(422).send({ error: 'Title and content must be provided' });
  }

  try {
    const id = await posts.newPost({
      title: title,
      content: content,
      author: author,
      numImages: imagePaths.length
    });
    await images.uploadImages(id, imagePaths);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Internal server error' });
  }
});

router.use(adminGuard);

router.use('*', posts.forwardRequest);

export default router;
