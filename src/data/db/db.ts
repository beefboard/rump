import knex from 'knex';
import bcrypt from 'bcrypt';
import uuidParse from 'uuid-parse';

export interface User {
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  email: string;
  admin: boolean;
}

export interface SessionData {
  expiration: Date;
  username: string;
}

export interface AuthSession {
  username: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  token: string;
}

const TEST_MODE = process.env.NODE_ENV === 'test';

const TABLE_USERS = 'users';
const TABLE_SESSIONS = 'sessions';
const TABLE_POSTS = 'posts';

const pgConnectionConfig = {
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'example',
  database: process.env.PG_DB || 'test',
};

let db: knex;

function convertUuid(id: string) {
  return Buffer.from(uuidParse.parse(id));
}

async function generateUsersTable() {
  if (!await db.schema.hasTable(TABLE_USERS)) {
    await db.schema.createTable(TABLE_USERS, (table) => {
      table.string('username');
      table.string('password');
      table.string('firstName');
      table.string('lastName');
      table.string('email');
      table.boolean('admin');
      table.primary(['username']);
    });
  }
}

async function generateSessionsTable() {
  if (!await db.schema.hasTable(TABLE_SESSIONS)) {
    await db.schema.createTable(TABLE_SESSIONS, (table) => {
      table.binary('token');
      table.string('username');
      table.dateTime('expiration');
      table.primary(['token']);
    });
  }
}

async function generatePostsTable() {
  if (!await db.schema.hasTable(TABLE_POSTS)) {
    await db.schema.createTable(TABLE_POSTS, (table) => {
      table.binary('id');
      table.string('author');
      table.dateTime('date');
      table.string('title');
      table.string('content');
      table.boolean('approved');
      table.boolean('pinned');
    });
  }
}

export async function generateInitialUsers() {
  const password = TEST_MODE ? 'test' : 'admin';
  const username = TEST_MODE ? 'test' : 'admin';

  try {
    await db.insert({
      username: username,
      password: await bcrypt.hash(password, 10),
      firstName: 'test',
      lastName: 'test',
      admin: true
    }).into('users');
  } catch (e) {}
}

export async function clearUsers() {
  await db.delete().from(TABLE_USERS);
}

export async function initDb() {
  if (db) {
    return;
  }

  if (TEST_MODE) {
    db = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
      },
      useNullAsDefault: true,
      pool: { min: 0, max: 1 }
    });
  } else {
    db = knex({
      client: 'pg',
      connection: pgConnectionConfig
    });
  }

  await generateUsersTable();
  await generateInitialUsers();
  await generateSessionsTable();
  await generatePostsTable();
}

export async function getDetails(username: string): Promise<User | null> {
  const detailsRow = await db.select().from(TABLE_USERS).where('username', username).first();
  if (!detailsRow) {
    return null;
  }

  return {
    passwordHash: detailsRow['password'],
    username: detailsRow['username'],
    firstName: detailsRow['firstName'],
    lastName: detailsRow['lastName'],
    email: detailsRow['email'],
    admin: detailsRow['admin']
  };
}

export async function saveUser(user: User) {
  if (await db.select('username').from(TABLE_USERS).where('username', user.username).first()) {
    return false;
  }

  await db.insert({
    username: user.username,
    password: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    admin: user.admin
  }).into(TABLE_USERS);

  return true;
}

export async function storeSession(token: string, username: string, expiration: Date) {
  const binToken = convertUuid(token);

  try {
    await db.insert({
      username: username,
      expiration: expiration,
      token: binToken
    }).into(TABLE_SESSIONS);
  } catch (e) {
    await db.update({
      username: username,
      expiration: expiration
    }).table(TABLE_SESSIONS).where('token', binToken);
  }
}

export async function getSession(token: string): Promise<SessionData | null> {
  const sessionData = await db.select(['username', 'expiration'])
                              .from(TABLE_SESSIONS)
                              .where('token', convertUuid(token))
                              .first();
  if (sessionData) {
    return sessionData as SessionData;
  }

  return null;
}

export async function removeSession(token: string): Promise<boolean> {
  return (
    await db
      .delete()
      .from(TABLE_SESSIONS)
      .where('token', convertUuid(token))
  ) > 0;
}

export async function removeSessions(olderThan: Date) {
  await db.delete().from(TABLE_SESSIONS).where('expiration', '<=', olderThan);
}
