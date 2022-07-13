import {describe, expect, test} from '@jest/globals';
import supertest from 'supertest';

import Server from '@/server';
import ServiceManager from '@/backend/serviceManager';

import Config from '@/config';

describe('Dialog API - Stateless', () => {
  let server: Server;
  beforeEach(() => {
    const config = {...Config};
    config.DISABLE_ORIGIN_CHECK = true;

    const serviceManager = new ServiceManager(config, {
      buildClients: () => ({
        rateLimitClient: {
          public: {
            consume: () => ({remainingPoints: 10, msBeforeNext: 1000})
          },
          private: {
            consume: () => ({remainingPoints: 10, msBeforeNext: 1000})
          }
        }
      } as any)
    });

    server = new Server(serviceManager);
  });

  describe('POST /interact', () => {
    test('test', async () => {
      const response = await supertest(server.app)
        .post('/interact')
        .set('authorization', 'token')
        .set('versionid', 'versionid')
        .expect(200);
    });
  });

  describe('POST /interact/:versionID', () => {
    test.todo('');
  });
});
