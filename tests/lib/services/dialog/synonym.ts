/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import sinon from 'sinon';

import * as synonym from '@/lib/services/dialog/synonym';

import { mockEntityNonSynonymRequest, mockEntitySynonymRequest, mockLM } from './fixture';

describe('intent entity synonyms unit tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('rectifyEntityValues', () => {
    it('Converts entity synonyms into the primary entity value', () => {
      const result = synonym.rectifyEntityValue(mockEntitySynonymRequest, mockLM);

      expect(result.payload.entities[0].value).to.be.equal('big');
    });

    it('Preserves entity value if it is not a synonym of any primary entity values', () => {
      const result = synonym.rectifyEntityValue(mockEntityNonSynonymRequest, mockLM);

      expect(result.payload.entities[0].value).to.be.equal('medium');
    });
  });
});
