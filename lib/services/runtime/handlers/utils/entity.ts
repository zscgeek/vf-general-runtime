/* eslint-disable max-depth, sonarjs/cognitive-complexity, no-restricted-syntax */
import { BaseModels, BaseNode, BaseRequest, BaseTrace } from '@voiceflow/base-types';
import { ChatModels } from '@voiceflow/chat-types';
import { SLOT_REGEXP } from '@voiceflow/common';
import { VoiceModels } from '@voiceflow/voice-types';
import { VoiceflowConstants, VoiceflowUtils, VoiceflowVersion } from '@voiceflow/voiceflow-types';

import { DMStore } from '@/lib/services/dialog';
import NoMatchHandler, { NoMatchNode } from '@/lib/services/runtime/handlers/noMatch';
import { inputToString } from '@/lib/services/runtime/handlers/utils/output';
import { Runtime, Store } from '@/runtime';

import { StorageType } from '../../types';
import { addOutputTrace, getOutputTrace } from '../../utils';

export const VF_ELICIT = 'ELICIT';

export const entityFillingRequest = (
  name: string,
  requiredEntities?: string[]
): BaseRequest.IntentRequest & { requiredEntities?: string[] } => ({
  type: BaseRequest.RequestType.INTENT,
  payload: { intent: { name }, query: '', entities: [] },
  requiredEntities,
});

/** @description when VF_ELICIT is true, it will skip the entity prompt during entity filling */
export const setElicit = (
  request: BaseRequest.IntentRequest,
  elicit: boolean
): BaseRequest.IntentRequest & { [VF_ELICIT]: boolean } => ({
  ...request,
  [VF_ELICIT]: elicit,
});

export const hasElicit = (
  request: BaseRequest.IntentRequest & { [VF_ELICIT]?: boolean }
): request is BaseRequest.IntentRequest & { [VF_ELICIT]: true } => request[VF_ELICIT] === true;

export const getSlotNameByID = (id: string, model: BaseModels.PrototypeModel) => {
  return model.slots.find((lmEntity) => lmEntity.key === id)?.name;
};

export const findIntentEntity = (
  model: BaseModels.PrototypeModel,
  intentName: string,
  criteria: (name: string) => boolean
): (BaseModels.IntentSlot & { name: string }) | null => {
  const intentModelSlots = model.intents.find((intent) => intent.name === intentName)?.slots || [];

  for (const slot of intentModelSlots) {
    const name = getSlotNameByID(slot.id, model);
    if (name && criteria(name)) {
      return {
        ...slot,
        name,
      };
    }
  }

  return null;
};

export const getUnfulfilledEntity = (
  intentRequest: BaseRequest.IntentRequest,
  model: BaseModels.PrototypeModel,
  omit: string[] = []
): (BaseModels.IntentSlot & { name: string }) | null => {
  const extractedEntityNames = new Set(intentRequest.payload.entities.map((entity) => entity.name));

  return findIntentEntity(
    model,
    intentRequest.payload.intent.name,
    (name) => !omit.includes(name) && !extractedEntityNames.has(name)
  );
};

// replace all found entities with their value, if no value, empty string
// "inner" refers to the "slotname" of {{[slotname].slotid}}
export const replaceSlots = (input: string, variables: Record<string, string>) =>
  input.replace(SLOT_REGEXP, (_match, inner) => variables[inner] || '');

// create a dictionary of all entities from Entity[] => { [entity.name]: entity.value }
export const getEntitiesMap = (intentRequest: BaseRequest.IntentRequest): Record<string, string> =>
  intentRequest.payload.entities.reduce<Record<string, string>>(
    (acc, entity) => ({ ...acc, ...(entity.value && { [entity.name]: entity.value }) }),
    {}
  );

// Populates all entities in a given string
export const fillStringEntities = (intentRequest: BaseRequest.IntentRequest, input = '') => {
  const entityMap = getEntitiesMap(intentRequest);

  return replaceSlots(input, entityMap);
};

const noMatchHandler = NoMatchHandler();

export const EntityFillingNoMatchHandler = (elicitOverride?: boolean) => ({
  handle:
    (node: NoMatchNode, runtime: Runtime, variables: Store) =>
    async (intents?: string[], defaultRequest?: BaseRequest.IntentRequest) => {
      // see if the prior entity filling intent is within context
      const priorIntent = runtime.storage.get<DMStore>(StorageType.DM)?.priorIntent;
      const priorIntentMatch =
        !!priorIntent &&
        (intents ?? []).includes(priorIntent.payload.intent.name) &&
        priorIntent?.payload.entities.length;

      const nextRequest = (priorIntentMatch && priorIntent) || defaultRequest;

      if (typeof runtime.storage.get(StorageType.ENTITY_REPROMPT_NAME) === 'string' && nextRequest) {
        let repromptName = runtime.storage.get(StorageType.ENTITY_REPROMPT_NAME);

        let unfulfilledEntity = findIntentEntity(
          runtime.version!.prototype!.model,
          defaultRequest!.payload.intent.name,
          (name) => name === repromptName
        );

        if (unfulfilledEntity) {
          const entityRepromptCount = runtime.storage.get<number>(StorageType.ENTITY_REPROMPT_COUNTER) ?? 0;

          if (entityRepromptCount >= unfulfilledEntity.dialog.prompt.length) {
            const exhausted = runtime.storage.get<string[]>(StorageType.ENTITY_REPROMPT_LIST) ?? [];
            exhausted.push(unfulfilledEntity.name);

            runtime.storage.set(StorageType.ENTITY_REPROMPT_LIST, exhausted);

            const nextUnfulfilledEntity = getUnfulfilledEntity(
              defaultRequest!,
              runtime.version!.prototype!.model,
              exhausted
            );

            if (nextUnfulfilledEntity) {
              runtime.storage.set(StorageType.ENTITY_REPROMPT_NAME, nextUnfulfilledEntity.name);
              runtime.storage.set(StorageType.ENTITY_REPROMPT_COUNTER, 0);
            } else {
              runtime.storage.delete(StorageType.ENTITY_REPROMPT_NAME);
              runtime.storage.delete(StorageType.ENTITY_REPROMPT_COUNTER);

              runtime.storage.set(StorageType.ENTITY_REPROMPT_DONE, true);
            }
          }
        }

        repromptName = runtime.storage.get(StorageType.ENTITY_REPROMPT_NAME);

        unfulfilledEntity = repromptName
          ? findIntentEntity(
              runtime.version!.prototype!.model,
              defaultRequest!.payload.intent.name,
              (name) => name === repromptName
            )
          : null;
        if (unfulfilledEntity) {
          const entityRepromptCount = runtime.storage.get<number>(StorageType.ENTITY_REPROMPT_COUNTER) ?? 0;

          const prompt = unfulfilledEntity.dialog.prompt[entityRepromptCount]! as
            | ChatModels.Prompt
            | VoiceModels.IntentPrompt<VoiceflowConstants.Voice>;

          const output = VoiceflowUtils.prompt.isIntentVoicePrompt(prompt)
            ? fillStringEntities(
                defaultRequest!,
                inputToString(
                  prompt,
                  (runtime.version! as VoiceflowVersion.VoiceVersion).platformData.settings.defaultVoice
                )
              )
            : prompt.content;

          runtime.trace.addTrace<BaseTrace.PathTrace>({
            type: BaseNode.Utils.TraceType.PATH,
            payload: { path: 'reprompt' },
          });

          addOutputTrace(
            runtime,
            getOutputTrace({
              output,
              version: runtime.version,
              variables,
              isPrompt: true,
            }),
            { node, variables }
          );

          runtime.storage.set(StorageType.ENTITY_REPROMPT_COUNTER, entityRepromptCount + 1);

          return node.id;
        }
      }

      if (typeof runtime.storage.get(StorageType.NO_MATCHES_COUNTER) !== 'number' && nextRequest) {
        runtime.storage.set(StorageType.NO_MATCHES_COUNTER, 0);
        runtime.trace.addTrace<BaseTrace.GoToTrace>({
          type: BaseNode.Utils.TraceType.GOTO,
          payload: { request: setElicit(nextRequest, elicitOverride ?? false) },
        });
        return node.id;
      }

      const noMatchPath = await noMatchHandler.handle(node, runtime, variables);
      if (noMatchPath === node.id && nextRequest) {
        runtime.trace.addTrace<BaseTrace.GoToTrace>({
          type: BaseNode.Utils.TraceType.GOTO,
          payload: { request: setElicit(nextRequest, elicitOverride ?? true) },
        });
      }
      return noMatchPath;
    },
});

// for alexa the entity (re)prompts are never elicit, the prompt is always generated on the alexa side
export const EntityFillingNoMatchAlexaHandler = () => EntityFillingNoMatchHandler(false);
