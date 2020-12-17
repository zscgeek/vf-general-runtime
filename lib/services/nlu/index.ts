import { Context, ContextHandler } from '@/types';

import { AbstractManager, injectServices } from '../utils';

export const utils = {};

@injectServices({ utils })
class NLU extends AbstractManager<{ utils: typeof utils }> implements ContextHandler {
  // TODO: implement NLU handler
  handle = async (context: Context) => {
    const { nlp, query } = context.request;

    if (!query) {
      return context;
    }

    const data = await this.services.luis.predict({ query, appID: nlp!.appID });

    console.log(data);

    return context;
  };
}

export default NLU;
