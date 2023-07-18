import { BaseTrace } from '@voiceflow/base-types';

import { ResolvedTextVariant } from '../response.types';
import { BaseVariant } from './base.variant';
import { resolveMarkup } from './resolveMarkup/resolveMarkup';

export class TextVariant extends BaseVariant<ResolvedTextVariant> {
  constructor(rawVariant: ResolvedTextVariant) {
    super(rawVariant);
  }

  get type() {
    return this.rawVariant.type;
  }

  get trace(): BaseTrace.TextTrace {
    return {
      type: BaseTrace.TraceType.TEXT,
      payload: {
        message: resolveMarkup(this.rawVariant.text),
        // $TODO$ - Need to remove `slate`
        slate: { id: 'dummy', content: [] },
      },
    };
  }
}
