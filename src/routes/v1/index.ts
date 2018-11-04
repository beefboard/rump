import { Router } from 'express';
import me from './me';
import posts from './posts';
import accounts from './accounts';

const router = Router();

router.use('/me', me);
router.use('/posts', posts);
router.use('/accounts', accounts);

router.get('/', (_, res) => {
  res.send({
    me: '/me',
    posts: '/posts',
    users: '/accounts',
    images: '/images'
  });
});

export default router;
