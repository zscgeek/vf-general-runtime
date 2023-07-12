import axios from 'axios';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  fetchKnowledgeBase,
  FLAGGED_WORSPACE_IDS,
  KNOWLEDGE_BASE_LAMBDA_ENDPOINT,
  RETRIEVE_ENDPOINT,
} from '@/lib/services/runtime/handlers/utils/knowledgeBase';

describe('knowledgebase retrieval unit tests', () => {
  describe('fetch knowledgebase', async () => {
    afterEach(() => {
      sinon.restore();
    });

    it('calls new KB when appropriate', async () => {
      const projectID = 'foo';
      const question = 'bar';
      const workspaceID = '123';
      const apiStub = sinon.stub(axios, 'post').resolves({ data: 'foo' });
      FLAGGED_WORSPACE_IDS.includes = sinon.stub().returns(true);

      fetchKnowledgeBase(projectID, workspaceID, question);
      expect(
        apiStub.calledOnceWith(RETRIEVE_ENDPOINT as string, { projectID, question, settings: sinon.match.any })
      ).to.eql(true);
    });

    it('calls old KB when appropriate', async () => {
      const projectID = 'foo';
      const question = 'bar';
      const workspaceID = '123';
      const apiStub = sinon.stub(axios, 'post').resolves({ data: 'foo' });
      FLAGGED_WORSPACE_IDS.includes = sinon.stub().returns(false);
      const expectedEndpoint = `${KNOWLEDGE_BASE_LAMBDA_ENDPOINT}/answer`;

      fetchKnowledgeBase(projectID, workspaceID, question);
      expect(apiStub.calledOnceWith(expectedEndpoint, { projectID, question, settings: sinon.match.any })).to.eql(true);
    });
  });
});
