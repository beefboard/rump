import { Router } from 'express';

import v1 from './v1';

const router = Router();

router.use('/v1', v1);

router.get('/', (_, res) => {
  res.send({
    v1: '/v1'
  });
});

router.use((_, res) => {
  res.status(404).send({
    error: 'Not found'
  });
});

export default router;
