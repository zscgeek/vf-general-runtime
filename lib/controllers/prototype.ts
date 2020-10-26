import { State } from '@voiceflow/client';
import { StateRequest } from '@voiceflow/general-types';

import { AbstractController } from './utils';

class PrototypeController extends AbstractController {
  async handler(req: { body: { state: State; request?: StateRequest } }) {
    const { prototype, metrics } = this.services;

    metrics.prototypeRequest();

    return prototype.invoke(req.body.state, req.body.request);
  }
}

export default PrototypeController;
