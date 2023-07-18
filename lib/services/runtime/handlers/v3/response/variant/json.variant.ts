import { BaseTrace } from '@voiceflow/base-types';

import { ResolvedJSONVariant } from '../response.types';
import { BaseVariant } from './base.variant';
import { resolveMarkup } from './resolveMarkup/resolveMarkup';

export class JSONVariant extends BaseVariant<ResolvedJSONVariant> {
  constructor(rawVariant: ResolvedJSONVariant) {
    super(rawVariant);
  }

  get type() {
    return this.rawVariant.type;
  }

  get trace(): BaseTrace.JSONTrace {
    return {
      type: BaseTrace.TraceType.JSON,
      payload: {
        json: JSON.parse(resolveMarkup(this.rawVariant.json)),
      },
    };
  }
}
