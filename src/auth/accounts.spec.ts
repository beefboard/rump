import * as accounts from './accounts';
import { UserDetails, initDb } from './db/db';

beforeAll(async () => {
  await initDb();
});

describe('login', () => {
  it('should refuse invalid passwords', async () => {
    expect.assertions(1);
    const token = await accounts.login('test', 'fail');

    expect(token).not.toBe(expect.anything());
  });

  it('should refuse invalid accounts', async () => {
    expect.assertions(1);
    const token = await accounts.login('sdfsadf', 'fail');

    expect(token).not.toBe(expect.anything());
  });

  it('should create a token for valid credentials', async () => {
    expect.assertions(1);
    const token = (await accounts.login('test', 'test')) as string;

    expect(token.length).toBeGreaterThan(0);
  });

  it('should accept any case for username', async () => {
    expect.assertions(1);

    const token = (await accounts.login('TesT', 'test')) as string;

    expect(token.length).toBeGreaterThan(0);
  });
});

describe('logout', async () => {
  it('should allow session to be deleted', async () => {
    expect.assertions(2);

    const token = (await accounts.login('test', 'test')) as string;

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
    const token = (await accounts.login('test', 'test')) as string;
    if (!token) {
      throw Error('Could not get token');
    }

    const session = await accounts.getSession(token);
    expect(session).toBeTruthy();
  });

  it('should store the username in the session', async () => {
    expect.assertions(1);

    const token = await accounts.login('test', 'test');
    if (!token) {
      throw Error('Could not get token');
    }

    const session = await accounts.getSession(token);
    if (!session) {
      throw Error('Could not get session from token');
    }

    expect(session.username).toBe('test');
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

  it('should expect unique usernames', async () => {
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
