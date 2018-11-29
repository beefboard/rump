import supertest from 'supertest';
import { execSync } from 'child_process';
import * as uuid from 'uuid';

const HOST = process.env.ACCEPTENCE_SERVER || 'http://localhost:2737';

jest.setTimeout(60000);

/**
 * Start the docker network with the container we have built.
 *
 * This will allow us to test the container in issolation with
 * the postgres database.
 */

beforeAll(async () => {
  execSync('docker-compose -f docker-compose.acceptence.yml up -d');

  // Wait for server to be up
  while (true) {
    try {
      const response = await supertest(HOST).get('/');

      if (response.status === 200) {
        break;
      }
    } catch (e) {}

    await new Promise((resolve) => {
      return setTimeout(resolve, 200);
    });
  }
});

afterAll(() => {
  try {
    execSync('docker-compose -f docker-compose.acceptence.yml down');
  } catch (_) {}
});

describe('acceptence', () => {
  it('responds', async () => {
    const response = await supertest(HOST).get('/');
    expect(response.status).toBe(200);
  });

  it('allows votes to be made', async () => {
    const postId = uuid.v1();
    await supertest(HOST).put(`/v1/grades/${postId}`).send({
      user: 'test',
      grade: -1
    });

    const response = await supertest(HOST).get(`/v1/grades/${postId}`).query({
      user: 'test'
    });

    expect(response.body).toEqual({
      grade: -1,
      user: -1
    });
  });

  it('sums votes', async () => {
    const postId = uuid.v1();
    await supertest(HOST).put(`/v1/grades/${postId}`).send({
      user: 'test',
      grade: 1
    });

    await supertest(HOST).put(`/v1/grades/${postId}`).send({
      user: 'fsdfasdf',
      grade: 1
    });

    await supertest(HOST).put(`/v1/grades/${postId}`).send({
      user: 'werweir',
      grade: 1
    });

    await supertest(HOST).put(`/v1/grades/${postId}`).send({
      user: 'sdlfksdf',
      grade: -1
    });

    const response = await supertest(HOST).get(`/v1/grades/${postId}`).query({
      user: 'test'
    });

    expect(response.body).toEqual({
      grade: 2,
      user: 1
    });

    const response2 = await supertest(HOST).get(`/v1/grades/${postId}`).query({
      user: 'sdlfksdf'
    });

    expect(response2.body).toEqual({
      grade: 2,
      user: -1
    });
  });

  it('allows queries for posts without votes', async () => {
    const postId = uuid.v1();
    const response = await supertest(HOST).get(`/v1/grades/${postId}`).query({
      user: 'sdfgdf'
    });

    expect(response.body).toEqual({
      user: 0,
      grade: 0
    });
  });
});
