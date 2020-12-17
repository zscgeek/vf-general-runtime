import { LUISRuntimeClient } from '@azure/cognitiveservices-luis-runtime';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

import { Config } from '@/types';

import { AbstractClient } from './utils';

class Luis extends AbstractClient {
  private client: LUISRuntimeClient;

  constructor(config: Config) {
    super(config);

    const luisAuthoringCredentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': config.LUIS_PREDICTION_KEY } });

    this.client = new LUISRuntimeClient(luisAuthoringCredentials, config.LUIS_PREDICTION_ENDPOINT);
  }

  public async predict({ query, appID, isProduction }: { query: string; appID: string; isProduction?: boolean }) {
    const deploySlotName = isProduction ? 'Production' : 'Staging';

    const { prediction } = await this.client.prediction.getSlotPrediction(appID, deploySlotName, { query }, { showAllIntents: true });

    return {
      query,
      intents: prediction.intents,
      entities: prediction.entities,
      topIntent: prediction.topIntent,
    };
  }
}

export default Luis;
