import * as session from './session';

import { initDb } from './auth/db/db';
import { mockRes, mockReq } from 'sinon-express-mock';

const accounts = require('./auth/accounts');
jest.mock('./auth/accounts');

console.error = () => {};

beforeAll(async () => {
  await initDb();
});

describe('decoder', () => {
  it('should decode session from token in request header', async () => {
    expect.assertions(1);

    const mockSession = {
      username: 'test',
    };

    accounts.getSession.mockImplementation(() => {
      return mockSession;
    });
    const req = mockReq({
      headers: {
        'x-access-token': 'a-token'
      }
    });

    await session.decoder(req, mockRes(), jest.fn());
    expect(req.session).toEqual(mockSession);
  });

  it('should not decode session from bad tokens', async () => {
    expect.assertions(1);

    accounts.getSession.mockImplementation(() => {
      return null;
    });

    const token = 'this-is-bad';

    const req = mockReq({
      headers: {
        'x-access-token': token
      }
    });

    await session.decoder(req, mockRes(), jest.fn());
    expect(req.session).not.toBe(expect.anything());
  });

  it('should return 500 when session decoding fails', async () => {
    expect.assertions(2);

    const token = 'this-is-ok';
    accounts.getSession.mockImplementation(() => {
      throw new Error('error decoding');
    });

    const req = mockReq({
      headers: {
        'x-access-token': token
      }
    });

    const res = mockRes();

    await session.decoder(req, res, jest.fn());
    expect(res.status.args[0][0]).toBe(500);
    expect(res.send.args[0][0]).toEqual({ error: 'Internal server error' });
  });

  it('should call next after decoding', async () => {
    const next = jest.fn();
    await session.decoder(
      mockReq({
        headers: {}
      }),
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalled();
  });
});

describe('guard', () => {
  it('should send 401 when session is defined', () => {
    expect.assertions(2);
    const expectedData = {
      error: 'Unauthorised'
    };

    const testRes = mockRes();

    const req = mockReq();

    session.guard(req, testRes, () => {});
    expect(testRes.status.calledWith(401)).toBe(true);
    expect(testRes.send.calledWith(expectedData)).toBe(true);
  });

  it('should call next when session has username', () => {
    expect.assertions(1);

    const req = mockReq({
      session: {
        username: 'test'
      }
    });

    const next = jest.fn();

    session.guard(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('admin guard', () => {
  it('should send 403 when session not admin', () => {
    expect.assertions(2);
    const expectedData = {
      error: 'Forbidden'
    };

    const testRes = mockRes();

    const req = {
      session: {
        username: 'test',
        admin: false
      }
    } as any;

    session.adminGuard(req, testRes, () => {});
    expect(testRes.status.calledWith(403)).toBe(true);
    expect(testRes.send.calledWith(expectedData)).toBe(true);
  });

  it('should call next when session is admin', () => {
    expect.assertions(1);

    const req = mockReq({
      session: {
        username: 'test',
        admin: true
      }
    });

    const next = jest.fn();

    session.adminGuard(req as any, null as any, next);
    expect(next).toBeCalled();
  });
});
