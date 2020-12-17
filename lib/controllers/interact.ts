import { State, TurnBuilder } from '@voiceflow/runtime';
import VError from '@voiceflow/verror';
import { Request } from 'express';

import { ContextRequest } from '@/types';

import { AbstractController } from './utils';

class InteractController extends AbstractController {
  async state(req: Request<{ versionID: string }>) {
    return this.services.state.generate(req.params.versionID);
  }

  async handler(req: Request<{ versionID: string }, null, { state?: State; request?: Omit<ContextRequest, 'nlp'> }>) {
    const { runtime, metrics, nlu, tts, dialog, asr, state: stateManager, dataAPI } = this.services;

    metrics.generalRequest();

    const {
      body: { state, request },
      params: { versionID },
    } = req;

    const { projectID } = await dataAPI.getVersion(versionID);
    const { prototype } = await dataAPI.getProject(projectID);

    if (!prototype?.nlp) {
      throw new VError('Prototype is not rendered!');
    }

    const turn = new TurnBuilder<ContextRequest>(stateManager);

    turn.addHandlers(asr, nlu, dialog, runtime).addHandlers(tts);

    return turn.handle({
      state,
      request: { ...request, nlp: prototype.nlp },
      versionID,
    });
  }
}

export default InteractController;
