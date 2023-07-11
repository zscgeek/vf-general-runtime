import axios from 'axios';
import { expect } from 'chai';
import sinon from 'sinon';

import { fetchKnowledgeBase, RETRIEVE_ENDPOINT } from '@/lib/services/runtime/handlers/utils/knowledgeBase';

describe('knowledgebase retrieval unit tests', () => {
  describe('fetch knowledgebase', async () => {
    it('makes the correct api call', async () => {
      const projectID = 'foo';
      const question = 'bar';
      const apiStub = sinon.stub(axios, 'post').resolves({ data: 'foo' });

      fetchKnowledgeBase(projectID, question);
      expect(
        apiStub.calledOnceWith(RETRIEVE_ENDPOINT as string, { projectID, question, settings: sinon.match.any })
      ).to.eql(true);
    });
  });
});
