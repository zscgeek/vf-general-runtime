import { BaseTrace } from '@voiceflow/base-types';

import { ResolvedTextVariant } from '../response.types';
import { BaseVariant } from './base.variant';

export class TextVariant extends BaseVariant<ResolvedTextVariant> {
  get type() {
    return this.rawVariant.type;
  }

  trace(): BaseTrace.V3.TextTrace | null {
    const resolvedMarkup = this.varContext.resolveMarkup(this.rawVariant.text);

    return resolvedMarkup.length
      ? {
          type: BaseTrace.TraceType.V3_TEXT,
          payload: {
            content: resolvedMarkup,
          },
        }
      : null;
  }
}
