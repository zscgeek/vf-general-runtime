import { IntentRequest, RequestType } from '@voiceflow/general-types';

import { Context, ContextHandler } from '@/types';

import { getNoneIntentRequest } from '../dialog/utils';
import { AbstractManager, injectServices } from '../utils';
import { handleNLCCommand } from './nlc';

export const utils = {};

@injectServices({ utils })
class NLU extends AbstractManager<{ utils: typeof utils }> implements ContextHandler {
  predict = async (query: string, projectID: string) => {
    const { data } = await this.services.axios.post<IntentRequest>(`${this.config.GENERAL_SERVICE_ENDPOINT}/runtime/${projectID}/predict`, {
      query,
    });

    return data;
  };

  handle = async (context: Context) => {
    // only try to convert text requests to intent requests
    if (context.request?.type !== RequestType.TEXT) {
      return context;
    }
    const query = context.request.payload;

    // empty string input - we can also consider return request: null as well (this won't advance the conversation)
    if (!query?.trim()) {
      return {
        ...context,
        request: getNoneIntentRequest(),
      };
    }

    const version = await context.data.api.getVersion(context.versionID);
    if (!version) {
      throw new Error('Version not found!');
    }

    let request: IntentRequest;
    try {
      request = await this.predict(query, version.projectID);
    } catch (err) {
      if (!version.prototype?.model) {
        throw new Error('Model not found!');
      }

      request = (await handleNLCCommand(context.request.payload, version.prototype.model)) || getNoneIntentRequest();
    }

    return {
      ...context,
      request,
    };
  };
}

export default NLU;
