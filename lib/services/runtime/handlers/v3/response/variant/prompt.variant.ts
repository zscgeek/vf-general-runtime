import { BaseTrace } from '@voiceflow/base-types';

import { ResolvedPromptVariant } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { BaseVariant } from './base.variant';

export class PromptVariant extends BaseVariant<ResolvedPromptVariant> {
  constructor(rawVariant: ResolvedPromptVariant, varContext: VariableContext) {
    super(rawVariant, varContext);
  }

  get type() {
    return this.rawVariant.type;
  }

  get trace(): BaseTrace.TextTrace {
    throw new Error(`evaluating ${this.rawVariant.type} variants is not implemented`);
  }
}
