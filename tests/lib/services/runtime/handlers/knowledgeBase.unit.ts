import axios from 'axios';
import { expect } from 'chai';
import sinon from 'sinon';

import Config from '@/config';
import { fetchKnowledgeBase } from '@/lib/services/runtime/handlers/utils/knowledgeBase';

describe('knowledgebase retrieval unit tests', () => {
  const { KL_RETRIEVER_SERVICE_HOST: host, KL_RETRIEVER_SERVICE_PORT: port } = Config;
  const scheme = process.env.NODE_ENV === 'e2e' ? 'https' : 'http';

  afterEach(() => sinon.restore());

  describe('fetch knowledgebase', async () => {
    it('makes the correct api call', async () => {
      const projectID = 'foo';
      const question = 'bar';
      const apiStub = sinon.stub(axios, 'post').resolves({ data: 'foo' });

      const expectedEndpoint = new URL(`${scheme}://${host}:${port}/retrieve`).href;

      fetchKnowledgeBase(projectID, question);
      await expect(apiStub.calledOnceWith(expectedEndpoint, { projectID, question, settings: sinon.match.any })).to.be
        .true;
    });
  });
});
