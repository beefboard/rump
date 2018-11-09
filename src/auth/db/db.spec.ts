import * as db from './db';

describe('db', () => {
  describe('initdb', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should initialise with sqlite in test mode', async () => {
      await db.initDb();
      expect(db.db.client.config.client).toBe('sqlite3');
    });

    it('should initialise with pg when not in test mode', async () => {
      process.env.NODE_ENV = 'production';
      // Don't expect postgress table generation to work
      try {
        await db.initDb();
      } catch (_) {}
      expect(db.db.client.config.client).toBe('pg');
    });

    it('should generate users table', async () => {
      await db.initDb();
      expect(await db.db.schema.hasTable(db.TABLE_USERS)).toBe(true);
    });

    it('should generate initial user', async () => {
      await db.initDb();
      expect(await db.db.table(db.TABLE_USERS)
        .select('username')
        .first()
      ).toEqual({ username: 'admin' });
    });

    it('should generate sessions table', async () => {
      await db.initDb();
      expect(await db.db.schema.hasTable(db.TABLE_SESSIONS)).toBe(true);
    });
  });
});
