import { Router } from 'express';
import { guard, adminGuard } from '../../session';
import * as accounts from '../../data/accounts';

const router = Router();

router.post('/', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;

  if (!username || !password || !firstName || !lastName || !email) {
    return res.status(422).send('Invalid data');
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
    console.error(e);
    res.status(500).send({
      error: 'Internal error'
    });
  }
});

router.get('/:username', async (req, res) => {
  const session = req.session;
  const username = req.params.username;

  try {
    const details = await accounts.getUser(username);

    if (!details) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (!session || !session.admin) {
      delete details.email;
    }

    res.send(details);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Internal error' });
  }
});

router.use(adminGuard);

export default router;
