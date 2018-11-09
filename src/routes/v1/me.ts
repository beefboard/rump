import { Router, Response } from 'express';
import { guard } from '../../session';
import * as accounts from '../../auth/accounts';

function handleError(error: any, res: Response) {
  console.error(error);
  res.status(500).send({
    error: 'Internal server error'
  });
}

const router = Router();

router.put('/', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(422).send({
      error: 'username and password must be provided'
    });
  }
  try {
    const token = await accounts.login(username, password);

    if (!token) {
      return res.status(401).send({
        error: 'Unauthorised'
      });
    }

    res.send({
      token: token
    });
  } catch (e) {
    handleError(e, res);
  }
});

router.get('/', guard, async (req, res) => {
  res.send(req.session);
});

router.delete('/', guard, async (req, res) => {
  await accounts.logout(req.session.token);
  res.send({ success: true });
});

export default router;
