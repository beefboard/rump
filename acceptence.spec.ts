import supertest from 'supertest';
import * as uuid from 'uuid';

const HOST = process.env.ACCEPTENCE_SERVER || 'http://localhost:2832';

describe('acceptence', () => {
  it('responds', async () => {
    const response = await supertest(HOST).get('/');
    expect(response.status).toBe(200);
  });
});
