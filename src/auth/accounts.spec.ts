import * as accounts from './accounts';
import mockdate from 'mockdate';
import moment from 'moment';

const db = require('./db/db');

beforeAll(async () => {
  await db.initDb();
});

describe('login', () => {
  it('should refuse invalid passwords', async () => {
    expect.assertions(1);
    const token = await accounts.login('admin', 'fail');

    expect(token).toBe(null);
  });

  it('should refuse invalid accounts', async () => {
    expect.assertions(1);
    const token = await accounts.login('sdfsadf', 'fail');

    expect(token).toBe(null);
  });

  it('should create a token for valid credentials', async () => {
    expect.assertions(1);
    const token = (await accounts.login('admin', 'admin')) as string;

    expect(token.length).toBeGreaterThan(0);
  });

  it('should ensure tokens are not already being used', async () => {
    expect.assertions(1);
    const oldFunction = db.getSession;

    // Cause get session to always return a session on the first call
    // and not on a the second call
    db.getSession = jest.fn().mockReturnValueOnce({
      username: 'test'
    });

    const token = (await accounts.login('admin', 'admin')) as string;

    db.getSession = oldFunction;
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate unque tokens for every login', async () => {
    expect.assertions(1);
    const token1 = (await accounts.login('admin', 'admin')) as string;
    const token2 = (await accounts.login('admin', 'admin')) as string;
    expect(token1).not.toBe(token2);
  });

  it('should accept any case for username', async () => {
    expect.assertions(1);

    const token = (await accounts.login('AdmiN', 'admin')) as string;

    expect(token.length).toBeGreaterThan(0);
  });
});

describe('logout', async () => {
  it('should allow session to be deleted', async () => {
    expect.assertions(2);

    const token = (await accounts.login('admin', 'admin')) as string;

    if (!token) {
      throw Error('Could not get token');
    }

    expect(await accounts.logout(token)).toBeTruthy();
    expect(await accounts.getSession(token)).not.toBe(expect.anything());
  });
});

describe('session', async () => {
  it('should return session from token', async () => {
    expect.assertions(1);
    const token = (await accounts.login('admin', 'admin')) as string;
    if (!token) {
      throw Error('Could not get token');
    }

    const session = await accounts.getSession(token);
    expect(session).toBeTruthy();
  });

  it('should remove sessions which are out of date', async () => {
    expect.assertions(1);
    const token = (await accounts.login('admin', 'admin')) as string;
    if (!token) {
      throw Error('Could not get token');
    }

    mockdate.set(moment().add(3, 'weeks'));

    const session = await accounts.getSession(token);
    expect(session).toBe(null);

    mockdate.reset();
  });

  it('should store the username in the session', async () => {
    expect.assertions(1);

    const token = await accounts.login('admin', 'admin');
    if (!token) {
      throw Error('Could not get token');
    }

    const session = await accounts.getSession(token);
    if (!session) {
      throw Error('Could not get session from token');
    }

    expect(session.username).toBe('admin');
  });

  it('should delete session if user no longer exists', async () => {
    await accounts.register({
      username: 'test2',
      password: 'test2',
      email: 'test@test.com',
      firstName: 'test',
      lastName: 'test'
    });

    const token = (await accounts.login('test2', 'test2')) as string;
    console.log(token);
    await accounts.clearUsers();

    const details = await accounts.getSession(token);
    expect(details).toBe(null);
  });

});
describe('registration', () => {
  beforeEach(async () => {
    await accounts.clearUsers();
  });

  it('should allow user registration', async () => {
    expect.assertions(1);
    const user = {
      username: 'test1',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test@test.com'
    };
    await accounts.register(user);

    const token = (await accounts.login('test1', 'test2')) as string;
    expect(token.length).toBeGreaterThan(0);
  });

  it('should accept unique usernames', async () => {
    expect.assertions(2);
    const user1 = {
      username: 'test2',
      password: 'test3',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test@test.com'
    };
    let success = await accounts.register(user1);

    expect(success).toBe(true);

    const user2 = {
      username: 'test2',
      password: 'test3',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test1@test.com'
    };
    success = await accounts.register(user2);
    expect(success).toBe(false);
  });

  it('should ignore username case', async () => {
    expect.assertions(1);
    const user = {
      username: 'lOweRCase',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com'
    };
    await accounts.register(user);

    const token = (await accounts.login('lowercase', 'test2')) as string;
    expect(token).not.toBe(null);
  });

  it('should not allow bad emails', async () => {
    expect.assertions(1);
    const user = {
      username: 'lOweRCase',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'bademail'
    };

    expect(await accounts.register(user)).toBe(false);
  });

  test('users should not be admin on registration', async () => {
    expect.assertions(1);
    const user = {
      username: 'lOweRCase',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com'
    };
    await accounts.register(user);

    const account = await accounts.getUser(user.username) as accounts.User;
    expect(account.admin).toBeFalsy();
  });
});

describe('retrieval', () => {
  it('should allow user details to be retreived from a username', async () => {
    expect.assertions(1);

    const user = {
      username: 'lOweRCase',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com'
    };
    await accounts.register(user);

    const details = await accounts.getUser('lowercase');
    expect(details).not.toBe(null);
  });

  it('should ignore case when searching for a username', async () => {
    const user = {
      username: 'lOweRCase',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com'
    };
    await accounts.register(user);

    const details = await accounts.getUser('LOWERCASE');
    expect(details).not.toBe(null);
  });

  it('should not provide password hash of user', async () => {
    expect.assertions(1);

    const user = {
      username: 'lOweRCase',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com'
    };
    await accounts.register(user);

    const details = (await accounts.getUser('lowercase')) as any;
    expect(details.passwordHash).not.toBe(expect.anything());
  });

  it('should return null for non existent user', async () => {
    expect.assertions(1);

    expect(await accounts.getUser('asdfasdf')).toBe(null);
  });
});

describe('promotion', () => {
  beforeEach(async () => {
    await accounts.clearUsers();
  });
  it('should allow accounts to be promoted to admin', async () => {
    const user = {
      username: 'user1',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com',
    };
    await accounts.register(user);
    await accounts.setAdmin('user1', true);

    const savedDetails = (await accounts.getUser('user1')) as any;
    expect(savedDetails.admin).toBeTruthy();
  });

  it('should allow accounts to be demoted', async () => {
    const user = {
      username: 'user1',
      password: 'test2',
      firstName: 'test5',
      lastName: 'test6',
      email: 'test3@test.com',
    };
    await accounts.register(user);
    await accounts.setAdmin('user1', true);
    await accounts.setAdmin('user1', false);

    const savedDetails = (await accounts.getUser('user1')) as any;
    expect(savedDetails.admin).toBeFalsy();
  });

  it('should return false if the account does not exist', async () => {
    expect(await accounts.setAdmin('user1', true)).toBe(false);
  });
});

describe('query', () => {
  it('should allow all admin accounts to be queried', async () => {
    for (let i = 0; i < 10; i += 1) {
      const user = {
        username: `user${i}`,
        password: 'test2',
        firstName: 'test5',
        lastName: 'test6',
        email: 'test3@test.com',
      };
      await accounts.register(user);
      if (i > 5) {
        await accounts.setAdmin(user.username, true);
      }
    }

    expect((await accounts.getAdmins()).length).toBe(5);
  });
});
