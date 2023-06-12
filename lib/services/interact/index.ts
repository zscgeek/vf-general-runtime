import { BaseRequest, BaseTrace, RuntimeLogs } from '@voiceflow/base-types';

import { RuntimeRequest } from '@/lib/services/runtime/types';
import log from '@/logger';
import { PartialContext, State, TurnBuilder } from '@/runtime';
import { Context } from '@/types';

import { AbstractManager, injectServices } from '../utils';
import autoDelegate from './autoDelegate';

export interface ResponseContext {
  request: RuntimeRequest;
  state: State;
  trace?: BaseTrace.AnyTrace[];
}

const utils = {
  autoDelegate,
  TurnBuilder,
};

@injectServices({ utils })
class Interact extends AbstractManager<{ utils: typeof utils }> {
  async state(versionID: string, authorization?: string): Promise<State> {
    const api = await this.services.dataAPI.get(authorization);
    const version = await api.getVersion(versionID);
    return this.services.state.generate(version);
  }

  async handler(req: {
    params: { userID?: string };
    body: { state?: State; action?: RuntimeRequest; request?: RuntimeRequest; config?: BaseRequest.RequestConfig };
    query: { locale?: string; logs?: RuntimeLogs.LogLevel; persona?: string };
    headers: {
      authorization?: string;
      origin?: string;
      sessionid?: string;
      versionID: string;
      platform?: string;
    };
  }): Promise<ResponseContext> {
    const {
      analytics,
      runtime,
      metrics,
      nlu,
      tts,
      dialog,
      asr,
      speak,
      slots,
      state: stateManager,
      filter,
      aiAssist,
    } = this.services;

    const {
      // `request` prop is deprecated, replaced with `action`
      // Internally the name request is still used
      body: { state, config = {}, action = null, request = null },
      params: { userID },
      query: { locale, logs: maxLogLevel, persona },
      headers: { authorization, versionID, origin, sessionid, platform },
    } = req;

    metrics.generalRequest();
    if (authorization?.startsWith('VF.')) metrics.sdkRequest();

    const context: PartialContext<Context> = {
      data: {
        locale,
        config,
        reqHeaders: { authorization, origin, sessionid, platform },
      },
      state,
      userID,
      request: action ?? request,
      versionID,
      maxLogLevel: maxLogLevel ?? RuntimeLogs.LogLevel.OFF,
    };

    const turn = new this.services.utils.TurnBuilder<Context>(stateManager);

    turn.addHandlers(asr, nlu, aiAssist, slots, dialog, runtime);
    turn.addHandlers(analytics);

    if (config.tts) {
      turn.addHandlers(tts);
    }

    turn.addHandlers(speak, filter);

    // Fill in the persona
    // HACK: to maintain compatibility with existing behavior for variable states,
    //       the initial variable values are injected here instead of in "initializeVariables" function
    let personaBody;
    try {
      if (persona) {
        const api = await this.services.dataAPI.get(authorization);
        personaBody = await api.getVariableState(persona);
        if (personaBody) {
          context.state!.variables = {
            ...context.state!.variables,
            ...personaBody.variables,
          };
        }
      }
    } catch (err) {
      log.warn(`Variable state ID ${persona} not found!`);
    }

    if (config.selfDelegate) {
      return turn.resolve(turn.handle(context));
    }
    return turn.resolve(this.services.utils.autoDelegate(turn, context));
  }
}

export default Interact;
