/**
 * [[include:entityFilling.md]]
 * @packageDocumentation
 */

import { Models, Request, Trace } from '@voiceflow/base-types';
import { TraceType } from '@voiceflow/base-types/build/common/trace';
import { Types as ChatTypes } from '@voiceflow/chat-types';
import { Constants } from '@voiceflow/general-types';
import { Types as VoiceTypes } from '@voiceflow/voice-types';
import _ from 'lodash';

import { hasElicit } from '@/lib/services/runtime/handlers/utils/entity';
import log from '@/logger';
import { Context, ContextHandler } from '@/types';

import { handleNLCEntityFilling } from '../nlu/nlc';
import { getNoneIntentRequest, NONE_INTENT } from '../nlu/utils';
import { isIntentRequest, StorageType } from '../runtime/types';
import { outputTrace } from '../runtime/utils';
import { AbstractManager, injectServices } from '../utils';
import { rectifyEntityValue } from './synonym';
import {
  efPrefix,
  fillStringEntities,
  getEntitiesMap,
  getIntentEntityList,
  getUnfulfilledEntity,
  inputToString,
  isIntentInScope,
  VF_EF_PREFIX,
} from './utils';

export const utils = {
  outputTrace,
  isIntentInScope,
};

export type EFStore = {
  intentRequest?: Request.IntentRequest;
  priorIntent?: Request.IntentRequest;
};

@injectServices({ utils })
class EntityFilling extends AbstractManager<{ utils: typeof utils }> implements ContextHandler {
  static setEFStore(context: Context, store: EFStore | undefined) {
    return { ...context, state: { ...context.state, storage: { ...context.state.storage, [StorageType.ENTITY_FILLING]: store } } };
  }

  handleDMContext = (
    efStateStore: EFStore,
    efPrefixedResult: Request.IntentRequest,
    incomingRequest: Request.IntentRequest,
    languageModel: Models.PrototypeModel
  ): boolean => {
    const efPrefixedResultName = efPrefixedResult.payload.intent.name;
    const incomingRequestName = incomingRequest.payload.intent.name;
    const expectedIntentName = efStateStore.intentRequest!.payload.intent.name;

    log.trace(`[app] [runtime] [ef] DM-Prefixed inference result ${log.vars({ resultName: efPrefixedResultName })}`);

    if (efPrefixedResultName.startsWith(VF_EF_PREFIX) || efPrefixedResultName === expectedIntentName) {
      // Remove hash prefix entity from the DM-prefixed result
      efPrefixedResult.payload.entities = efPrefixedResult.payload.entities.filter((entity) => !entity.name.startsWith(VF_EF_PREFIX));
      const intentEntityList = getIntentEntityList(expectedIntentName, languageModel);
      // Check if the efPrefixedResult entities are a subset of the intent's entity list
      const entitySubset = efPrefixedResult.payload.entities.filter((efEntity) => intentEntityList?.find((entity) => entity?.name === efEntity.name));
      if (entitySubset.length) {
        // CASE-B1: the prefixed intent only contains entities that are in the target intent's entity list
        // Action: Use the entities extracted from the prefixed intent to overwrite any existing filled entities
        entitySubset.forEach((entity) => {
          const storedEntity = efStateStore.intentRequest!.payload.entities.find((stored) => stored.name === entity.name);
          if (!storedEntity) {
            efStateStore.intentRequest!.payload.entities.push(entity); // Append entity
          } else {
            storedEntity.value = entity.value; // Update entity value
          }
        });
      } else {
        // CASE-B2_2: The prefixed intent has no entities extracted (except for the hash sentinel)
        // Action:  Migrate the user to the regular intent
        efStateStore.intentRequest = incomingRequest;
      }
    } else if (efPrefixedResultName === incomingRequestName) {
      // CASE-A1: The prefixed and regular calls match the same (non-DM) intent that is different from the original intent
      // Action: Migrate user to the new intent and extract all the available entities
      efStateStore.intentRequest = incomingRequest;
    } else {
      // (Unlikely) CASE-A2: The prefixed and regular calls do not match the same intent
      // Action: return true; Fallback intent
      return true;
    }

    // Fallback intent is not needed here
    return false;
  };

  handle = async (context: Context) => {
    if (!isIntentRequest(context.request)) {
      return context;
    }

    const version = await context.data.api.getVersion(context.versionID);

    if (!version) {
      throw new Error('Version not found!');
    }

    if (!version.prototype?.model) {
      throw new Error('Model not found!');
    }

    const incomingRequest = context.request;
    const currentStore = context.state.storage[StorageType.ENTITY_FILLING];
    const efStateStore: EFStore = { ...currentStore, priorIntent: currentStore?.intentRequest };

    // if there is an existing entity filling request
    if (efStateStore?.intentRequest) {
      log.debug('[app] [runtime] [ef] in entity filling context');

      const { query } = incomingRequest.payload;

      try {
        const prefix = efPrefix(efStateStore.intentRequest.payload.intent.name);
        const efPrefixedResult = this.config.GENERAL_SERVICE_ENDPOINT
          ? await this.services.nlu.predict({
              query: `${prefix} ${query}`,
              projectID: version.projectID,
            })
          : incomingRequest;

        // Remove the efPrefix from entity values that it has accidentally been attached to
        efPrefixedResult.payload.entities.forEach((entity) => {
          entity.value = _.isString(entity.value) ? entity.value.replace(prefix, '').trim() : entity.value;
        });

        const isFallback = this.handleDMContext(efStateStore, efPrefixedResult, incomingRequest, version.prototype.model);

        if (isFallback) {
          return {
            ...EntityFilling.setEFStore(context, { ...efStateStore, intentRequest: undefined }),
            request: getNoneIntentRequest(query),
          };
        }
      } catch (err) {
        const resultNLC = handleNLCEntityFilling({
          query,
          model: version.prototype.model,
          locale: version.prototype.data!.locales[0] as Constants.Locale,
          efRequest: efStateStore.intentRequest,
        });

        if (resultNLC.payload.intent.name === NONE_INTENT) {
          return {
            ...EntityFilling.setEFStore(context, { ...efStateStore, intentRequest: undefined }),
            request: getNoneIntentRequest(query),
          };
        }

        efStateStore.intentRequest = resultNLC;
      }
    } else {
      log.debug('[app] [runtime] [ef] in regular context');

      if (!(await this.services.utils.isIntentInScope(context))) {
        return context;
      }

      // Since we are in the regular context, we just set the intentRequest object in the DM state store as-is.
      // The downstream code will decide if further DM processing is needed.
      efStateStore.intentRequest = incomingRequest;
    }

    // Set the DM state store without modifying the source context
    context = EntityFilling.setEFStore(context, efStateStore);

    // Are there any unfulfilled required entities?
    // We need to use the stored DM state here to ensure that previously fulfilled entities are also considered!
    const unfulfilledEntity = getUnfulfilledEntity(efStateStore!.intentRequest, version.prototype.model);

    if (unfulfilledEntity) {
      // There are unfulfilled required entities -> return entity filling prompt
      // Assemble return string by populating the inline entity values
      const trace: Trace.AnyTrace[] = [];

      const prompt = _.sample(unfulfilledEntity.dialog.prompt)! as ChatTypes.Prompt | VoiceTypes.IntentPrompt<string>;

      if (!hasElicit(incomingRequest) && prompt) {
        const variables = getEntitiesMap(efStateStore!.intentRequest);

        const output =
          'content' in prompt
            ? prompt.content
            : fillStringEntities(inputToString(prompt, version.platformData.settings.defaultVoice), efStateStore!.intentRequest);

        trace.push(outputTrace({ output, variables }));
      }
      trace.push({
        type: TraceType.ENTITY_FILLING,
        payload: {
          entityToFill: unfulfilledEntity.name,
          intent: efStateStore.intentRequest,
        },
      });

      return {
        ...context,
        end: true,
        trace,
      };
    }

    // No more unfulfilled required entities -> populate the request object with the final intent and extracted entities from the DM state store
    context.request = rectifyEntityValue(efStateStore!.intentRequest, version.prototype.model);

    // Clear the DM state store
    return EntityFilling.setEFStore(context, undefined);
  };
}

export default EntityFilling;
