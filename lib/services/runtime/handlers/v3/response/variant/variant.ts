import VError from '@voiceflow/verror';

import { LanguageGenerator } from '../language-generator/language-generator';
import { ResolvedVariant, ResponseVariantType } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { JSONVariant } from './json.variant';
import { PromptVariant } from './prompt.variant';
import { TextVariant } from './text.variant';
import { Variant } from './variant.interface';

export function buildVariant(
  rawVariant: ResolvedVariant,
  varContext: VariableContext,
  langGen: LanguageGenerator
): Variant {
  switch (rawVariant.type) {
    case ResponseVariantType.TEXT:
      return new TextVariant(rawVariant, varContext);
    case ResponseVariantType.JSON:
      return new JSONVariant(rawVariant, varContext);
    case ResponseVariantType.PROMPT:
      return new PromptVariant(rawVariant, varContext, langGen);
    default:
      throw new VError('unknown variant type encountered');
  }
}
