import { expect } from 'chai';

import {
  getAnswerEndpoint,
  KNOWLEDGE_BASE_LAMBDA_ENDPOINT,
  RETRIEVE_ENDPOINT,
} from '@/lib/services/runtime/handlers/utils/knowledgeBase';

describe('knowledgebase retrieval unit tests', () => {
  describe('test getAnswerEndpoint', async () => {
    it('calls new KB when appropriate', async () => {
      // id for the Python KB Testing workspace created to test this feature
      const flaggedWorkspaceID = '80627';
      const endpoint = getAnswerEndpoint(flaggedWorkspaceID);

      expect(endpoint).to.eql(RETRIEVE_ENDPOINT);
    });

    it('calls old KB when appropriate', async () => {
      const nonFlaggedWorkspaceID = '123';
      const expectedEndpoint = `${KNOWLEDGE_BASE_LAMBDA_ENDPOINT}/answer`;
      const endpoint = getAnswerEndpoint(nonFlaggedWorkspaceID);

      expect(endpoint).to.eql(expectedEndpoint);
    });
  });
});
