/**
 * [[include:nlu.md]]
 * @packageDocumentation
 */

import { BaseModels, BaseRequest } from '@voiceflow/base-types';
import { VoiceflowConstants } from '@voiceflow/voiceflow-types';

import { isTextRequest } from '@/lib/services/runtime/types';
import { Context, ContextHandler } from '@/types';

import { AbstractManager, injectServices } from '../utils';
import { handleNLCCommand } from './nlc';
import { getNoneIntentRequest, NONE_INTENT } from './utils';

export const utils = {};

@injectServices({ utils })
/**
 * random
 */
class NLU extends AbstractManager<{ utils: typeof utils }> implements ContextHandler {
  // async predict({
  //   query,
  //   model,
  //   locale,
  //   projectID,
  // }: {
  //   query: string;
  //   model?: BaseModels.PrototypeModel;
  //   locale?: VoiceflowConstants.Locale;
  //   projectID: string;
  // }): Promise<BaseRequest.IntentRequest> {
  //   // 1. first try restricted regex (no open slots) - exact string match
  //   if (model && locale) {
  //     const intent = handleNLCCommand({ query, model, locale, openSlot: false });
  //     if (intent.payload.intent.name !== NONE_INTENT) {
  //       return intent;
  //     }
  //   }

  //   // 2. next try to resolve with luis NLP on general-service
  //   const { data } = await this.services.axios
  //     .post<BaseRequest.IntentRequest | null>(`${this.config.GENERAL_SERVICE_ENDPOINT}/runtime/${projectID}/predict`, {
  //       query,
  //     })
  //     .catch(() => ({ data: null }));

  //   if (data) {
  //     return data;
  //   }

  //   // 3. finally try open regex slot matching
  //   if (!model) {
  //     throw new Error('Model not found!');
  //   }
  //   if (!locale) {
  //     throw new Error('Locale not found!');
  //   }
  //   return handleNLCCommand({ query, model, locale, openSlot: true });
  // }

  async predict({ query }: { query: string } & Record<string, any>): Promise<BaseRequest.IntentRequest> {
    const topic = await this.services.pubsub.topic(this.config.PUBSUB_TOPIC_ID);

    const subscription = topic.subscription(this.config.PUBSUB_SUBSCRIPTION);

    const name = await new Promise<string>((resolve, reject) => {
      const subscriptionTimeout = setTimeout(() => {
        reject();
      }, 10000);

      subscription.on('message', (message) => {
        const data = JSON.parse(message.data.toString());
        console.log('MESSAGE RESPONSE', data);
        if (Array.isArray(data.intents)) {
          resolve(data.intents[0]);
          clearTimeout(subscriptionTimeout);
        }
        message.ack();
        subscription.close();
      });

      console.log('SENDING OUT QUERY', query);

      topic.publishMessage({
        json: {
          modelName: 'pubsubtest2',
          modelCompany: 'vf',
          modelWorkspace: 'denystest',
          modelCloud: 'pc',
          modelLanguage: 'en',
          utterance: query,
          reqGUID: 'abc123',
        },
      });
    });

    return {
      type: BaseRequest.RequestType.INTENT,
      payload: {
        intent: { name },
        query,
        entities: [],
      },
    };
  }

  handle = async (context: Context) => {
    if (!isTextRequest(context.request)) {
      return context;
    }

    // empty string input - we can also consider return request: null as well (this won't advance the conversation)
    if (!context.request.payload) {
      return {
        ...context,
        request: getNoneIntentRequest(),
      };
    }

    const version = await context.data.api.getVersion(context.versionID);

    if (!version) {
      throw new Error('Version not found!');
    }

    const request = await this.predict({
      query: context.request.payload,
      model: version.prototype?.model,
      locale: version.prototype?.data.locales[0] as VoiceflowConstants.Locale,
      projectID: version.projectID,
    });

    return { ...context, request };
  };
}

export default NLU;
