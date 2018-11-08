import { Router } from 'express';
import { guard } from '../../session';
import * as accounts from '../../auth/accounts';

const router = Router();

router.put('/', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(422).send({
      error: 'username and password must be provided'
    });
  }

  const token = await accounts.login(username, password);

  if (!token) {
    res.status(401).send({
      error: 'Unauthorised'
    });

    return;
  }

  res.send({
    token: token
  });
});

router.get('/', guard, async (req, res) => {
  res.send(req.session);
});

router.delete('/', guard, async (req, res) => {
  if (req.session) {
    await accounts.logout(req.session.token);
  }

  res.send({ success: true });
});

export default router;
