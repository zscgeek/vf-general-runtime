import { BaseTrace } from '@voiceflow/base-types';

import { ResolvedPromptVariant } from '../response.types';
import { BaseVariant } from './base.variant';

export class PromptVariant extends BaseVariant<ResolvedPromptVariant> {
  constructor(rawVariant: ResolvedPromptVariant) {
    super(rawVariant);
  }

  get type() {
    return this.rawVariant.type;
  }

  get trace(): BaseTrace.TextTrace {
    throw new Error(`evaluating ${this.rawVariant.type} variants is not implemented`);
  }
}
