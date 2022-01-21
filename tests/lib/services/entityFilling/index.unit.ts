/* eslint-disable no-unused-expressions */
import { Request } from '@voiceflow/base-types';
import { expect } from 'chai';
import sinon from 'sinon';

import EntityFilling, { utils as defaultUtils } from '@/lib/services/entityFilling';
import * as utils from '@/lib/services/entityFilling/utils';

import {
  mockEFPrefixedMultipleEntityResult,
  mockEFPrefixedNoEntityResult,
  mockEFPrefixedNonSubsetEntityResult,
  mockEFPrefixedUnrelatedSingleEntityResult,
  mockEFPrefixUnrelatedResult,
  mockEntityFillingTrace,
  mockEntityFillingTraceWithElicit,
  mockFulfilledIntentRequest,
  mockLM,
  mockRegularContext,
  mockRegularMultipleEntityResult,
  mockRegularNoEntityResult,
  mockRegularSingleEntityResult,
  mockRegularUnrelatedResult,
  mockUnfulfilledIntentRequest,
} from './fixture';

const createDM = () => {
  const services = {};
  return new EntityFilling({ utils: { ...defaultUtils, isIntentInScope: sinon.stub().resolves(true) }, ...services } as any, {} as any);
};

describe('entity filling unit tests', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('general handler', () => {
    it('fails if version is not found', async () => {
      const services = {
        dataAPI: { getVersion: sinon.stub().resolves() },
      };
      const ef = new EntityFilling({ utils: { ...defaultUtils }, ...services } as any, {} as any);
      const result = ef.handle({ request: { type: 'intent', payload: { entities: [], intent: { name: 'intent_name' } } } } as any);

      await expect(result).to.eventually.be.rejected;
    });

    it('exits early if intent not in scope', async () => {
      const services = {
        dataAPI: { getVersion: sinon.stub().resolves({ prototype: { model: true } }) },
      };
      const ef = new EntityFilling({ utils: { ...defaultUtils, isIntentInScope: sinon.stub().resolves(false) }, ...services } as any, {} as any);
      const context = {
        request: { type: 'intent', payload: { entities: [], intent: { name: 'intent_name' } } },
        state: { storage: {} },
        data: { api: services.dataAPI },
      };
      const result = await ef.handle(context as any);

      expect(result).to.eql(context);
    });
  });

  describe('DM-context handler', () => {
    const ef = createDM();

    describe('CASE-B1: DM-prefixed and regular calls match the same intent', () => {
      it('Upserts the DM state store with the new extracted entities', async () => {
        const efState = {
          intentRequest: mockRegularSingleEntityResult,
        };
        const result = await ef.handleDMContext(efState, mockEFPrefixedMultipleEntityResult, mockRegularMultipleEntityResult, mockLM);
        const sizeEntityValue = efState.intentRequest.payload.entities.find((entity) => entity.name === 'size');
        const toppingEntityValue = efState.intentRequest.payload.entities.find((entity) => entity.name === 'topping');

        expect(result).to.be.false; // No fallback intent
        expect(sizeEntityValue?.value).to.be.equal('large');
        expect(toppingEntityValue?.value).to.be.equal('pepperoni');
      });
    });

    describe('CASE-B1: DM-prefixed call contains entities that are a strict subset of the entities of the target intent', () => {
      it('Upserts the DM state store with the new extracted entities', async () => {
        const efState = {
          intentRequest: mockRegularNoEntityResult,
        };

        const result = await ef.handleDMContext(efState, mockEFPrefixedUnrelatedSingleEntityResult, mockRegularUnrelatedResult, mockLM);
        const sizeEntityValue = efState.intentRequest.payload.entities.find((entity) => entity.name === 'size');

        expect(result).to.be.false; // No fallback intent
        expect(sizeEntityValue?.value).to.be.equal('small');
      });
    });

    describe('CASE-B2: no entities extracted from DM-prefixed call', () => {
      it('Migrates DM context to the regular intent', async () => {
        const efState = {
          intentRequest: mockUnfulfilledIntentRequest,
        };
        const result = await ef.handleDMContext(efState, mockEFPrefixedNoEntityResult, mockRegularNoEntityResult, mockLM);

        expect(result).to.be.false; // No fallback intent
        expect(efState.intentRequest).to.deep.equal(mockRegularNoEntityResult);
      });
    });

    describe("CASE-B2: DM-prefixed call has entities that are not in the target intent's entity list", () => {
      it('Returns incoming intent', async () => {
        const efState = {
          intentRequest: mockRegularNoEntityResult,
        };
        const result = await ef.handleDMContext(efState, mockEFPrefixedNonSubsetEntityResult, mockRegularUnrelatedResult, mockLM);

        expect(result).to.be.false;
        expect(efState.intentRequest).to.eql(mockRegularUnrelatedResult);
      });
    });

    describe("CASE-A1: DM-prefixed and regular calls match the same intent that's different from the target intent", () => {
      it('Migrates DM context to the new regular call intent', async () => {
        const efState = {
          intentRequest: mockRegularNoEntityResult,
        };

        const result = await ef.handleDMContext(efState, mockEFPrefixUnrelatedResult, mockRegularUnrelatedResult, mockLM);

        expect(result).to.be.false; // no fallback intent
        expect(efState.intentRequest.payload.intent.name).to.be.equal('wings_order');
      });
    });

    describe("CASE-A2: DM-prefixed and regular calls don't match the same intent", () => {
      it('Returns FallBack intent', async () => {
        const efState = {
          intentRequest: mockRegularUnrelatedResult,
        };

        const result = await ef.handleDMContext(efState, mockRegularNoEntityResult, mockRegularUnrelatedResult, mockLM);

        expect(result).to.be.true; // trigger fallback intent
      });
    });
  });

  describe('Regular-context handler', () => {
    const ef = createDM();

    describe('with unfulfilled entities', async () => {
      it('correctly sets the DM state storage', async () => {
        const result = await ef.handle(mockRegularContext);

        const efStateStore = result.state.storage.dm;
        expect(efStateStore).to.not.be.undefined;
        expect(efStateStore.intentRequest).to.deep.equal(mockUnfulfilledIntentRequest);
      });

      it('returns the required entity prompt defined in the LM', async () => {
        const result = await ef.handle(mockRegularContext);

        const expectedTrace = [
          {
            type: 'speak',
            payload: {
              message: '<voice name="Default voice">what flavor?</voice>',
              type: 'message',
            },
          },
          mockEntityFillingTrace,
        ];
        expect(result.end).to.be.true;
        expect(result.trace).to.eql(expectedTrace);
      });

      it('returns empty entity prompt with elicit', async () => {
        const request = { ...mockUnfulfilledIntentRequest, ELICIT: true };
        const result = await ef.handle({
          ...mockRegularContext,
          request,
        });

        const expectedTrace = [mockEntityFillingTraceWithElicit];
        expect(result.end).to.be.true;
        expect(result.trace).to.eql(expectedTrace);
      });
    });

    describe('with fulfilled entities', () => {
      it('removes the DM prefix entities from final entity list', async () => {
        const result = await ef.handle(mockRegularContext);

        const resultEntities = (result.request as Request.IntentRequest).payload.entities;
        const hasEFPrefix = resultEntities.some((entity) => entity.name.startsWith(utils.VF_EF_PREFIX));
        expect(hasEFPrefix).to.be.false;
      });

      it('correctly populates the context request object', async () => {
        const fulfilledContext = { ...mockRegularContext };
        fulfilledContext.request = mockFulfilledIntentRequest;

        const result = await ef.handle(fulfilledContext);

        expect(result.request).to.deep.equal(mockFulfilledIntentRequest);
      });
    });
  });
});