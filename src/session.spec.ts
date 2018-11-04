import * as session from './session';
import * as accounts from './data/accounts';

import { initDb } from './data/db/db';
import { mockRes, mockReq } from 'sinon-express-mock';

beforeAll(async () => {
  await initDb();
});

describe('decoder', () => {
  it('should decode session from token in request header', async () => {
    expect.assertions(1);

    const token = await accounts.login('test', 'test');
    const req = mockReq({
      headers: {
        'x-access-token': token
      }
    });

    await session.decoder(req, mockRes(), jest.fn());
    expect(req.session).not.toBeNull();
  });

  it('should not decode session from bad tokens', async () => {
    expect.assertions(1);

    const token = 'this-is-bad';

    const req = mockReq({
      headers: {
        'x-access-token': token
      }
    });

    await session.decoder(req, mockRes(), jest.fn());
    expect(req.session).not.toBe(expect.anything());
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
