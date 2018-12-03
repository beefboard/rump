import knex from 'knex';
import bcrypt from 'bcrypt';
import uuidParse from 'uuid-parse';

export interface UserDetails {
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

export const TABLE_USERS = 'users';
export const TABLE_SESSIONS = 'sessions';

const pgConnectionConfig = {
  host: process.env.PG_HOST || 'localhost',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'example',
  database: process.env.PG_DB || 'test',
};

export let db: knex;

function convertUuid(id: string) {
  return Buffer.from(uuidParse.parse(id));
}

async function generateUsersTable() {
  if (!await db.schema.hasTable(TABLE_USERS)) {
    await db.schema.createTable(TABLE_USERS, (table) => {
      table.string('username').notNullable();
      table.string('password').notNullable();
      table.string('firstName').notNullable();
      table.string('lastName').notNullable();
      table.string('email').notNullable();
      table.boolean('admin').notNullable();
      table.primary(['username']);
    });
  }
}

async function generateSessionsTable() {
  if (!await db.schema.hasTable(TABLE_SESSIONS)) {
    await db.schema.createTable(TABLE_SESSIONS, (table) => {
      table.binary('token').notNullable();
      table.string('username').notNullable();
      table.dateTime('expiration').notNullable();
      table.primary(['token']);
    });
  }
}

export async function generateInitialUsers() {
  const password = 'admin';
  const username = 'admin';

  try {
    await db.insert({
      username: username,
      password: await bcrypt.hash(password, 10),
      firstName: 'test',
      lastName: 'test',
      email: 'freshollie@gmail.com',
      admin: true
    }).into('users');
  } catch (e) {}
}

export async function clearUsers() {
  await db.delete().from(TABLE_USERS);
}

export async function generateTables() {
  await generateUsersTable();
  await generateInitialUsers();
  await generateSessionsTable();
}

export async function initDb() {
  if (process.env.NODE_ENV === 'test') {
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
      connection: pgConnectionConfig,
      pool: { min: 0, max: 10 }
    });
  }

  await generateTables();
}

export async function getDetails(username: string): Promise<UserDetails | null> {
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

export async function queryUsers(admin: boolean): Promise<UserDetails[]> {
  const rows = await db.select().from(TABLE_USERS).where('admin', admin);
  const users: UserDetails[] = [];

  for (const row of rows) {
    users.push({
      passwordHash: row['password'],
      username: row['username'],
      firstName: row['firstName'],
      lastName: row['lastName'],
      email: row['email'],
      admin: row['admin']
    });
  }

  return users;
}

export async function saveUser(user: UserDetails) {
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

export async function setAdmin(username: string, admin: boolean) {
  return (
    await db.update({ admin: admin })
      .table(TABLE_USERS)
      .where('username', username)
  ) > 0;
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
