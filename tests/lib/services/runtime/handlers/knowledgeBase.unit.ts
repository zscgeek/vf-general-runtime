import axios from 'axios';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  fetchKnowledgeBase,
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
      // below is the id for the Python KB Testing workspace created to test this feature
      const flaggedWorkspaceID = '80627';
      const apiStub = sinon.stub(axios, 'post').resolves({ data: 'foo' });

      await fetchKnowledgeBase(projectID, flaggedWorkspaceID, question);
      expect(
        apiStub.calledOnceWith(RETRIEVE_ENDPOINT as string, { projectID, question, settings: sinon.match.any })
      ).to.eql(true);
    });

    it('calls old KB when appropriate', async () => {
      const projectID = 'foo';
      const question = 'bar';
      const nonFlaggedWorkspaceID = '123';
      const apiStub = sinon.stub(axios, 'post').resolves({ data: 'foo' });
      const expectedEndpoint = `${KNOWLEDGE_BASE_LAMBDA_ENDPOINT}/answer`;

      await fetchKnowledgeBase(projectID, nonFlaggedWorkspaceID, question);
      expect(apiStub.calledOnceWith(expectedEndpoint, { projectID, question, settings: sinon.match.any })).to.eql(true);
    });
  });
});
