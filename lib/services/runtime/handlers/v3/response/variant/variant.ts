import VError from '@voiceflow/verror';

import { ResolvedVariant, ResponseVariantType } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { JSONVariant } from './json.variant';
import { AIBilling, PromptVariant } from './prompt.variant';
import { TextVariant } from './text.variant';
import { Variant } from './variant.interface';

export function buildVariant(rawVariant: ResolvedVariant, varContext: VariableContext, billing: AIBilling): Variant {
  switch (rawVariant.type) {
    case ResponseVariantType.TEXT:
      return new TextVariant(rawVariant, varContext);
    case ResponseVariantType.JSON:
      return new JSONVariant(rawVariant, varContext);
    case ResponseVariantType.PROMPT:
      return new PromptVariant(rawVariant, varContext, billing);
    default:
      throw new VError('unknown variant type encountered');
  }
}
