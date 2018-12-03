import { Router, Response } from 'express';
import { guard, adminGuard } from '../../session';
import * as accounts from '../../auth/accounts';

function handleError(error: any, res: Response) {
  console.error(error);
  res.status(500).send({
    error: 'Internal server error'
  });
}

const router = Router();

router.post('/', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;

  if (!username || !password || !firstName || !lastName || !email) {
    return res.status(422).send({ error: 'Invalid data' });
  }

  try {
    const success = await accounts.register({
      username: username,
      password: password,
      firstName: firstName,
      lastName: lastName,
      email: email
    });

    if (!success) {
      return res.status(422).send({
        error: 'Bad details'
      });
    }

    res.send({ success: true });
  } catch (e) {
    handleError(e, res);
  }
});

router.get('/', async (req, res) => {
  const type = req.query.type;

  if (type !== 'admin') {
    return res.status(422).send({ error: 'Invalid query given' });
  }
  try {
    res.send({
      accounts: await accounts.getAdmins()
    });
  } catch (e) {
    handleError(e, res);
  }
});

router.get('/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const details = await accounts.getUser(username);

    if (!details) {
      return res.status(404).send({ error: 'Not found' });
    }

    res.send(details);
  } catch (e) {
    handleError(e, res);
  }
});

export default router;
