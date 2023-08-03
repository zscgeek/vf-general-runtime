import VError from '@voiceflow/verror';

import { LanguageGeneratorService } from '../language-generator/language-generator';
import { ResolvedVariant, ResponseVariantType } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { JSONVariant } from './json.variant';
import { PromptVariant } from './prompt.variant';
import { TextVariant } from './text.variant';
import { Variant } from './variant.interface';

export function buildVariant(
  rawVariant: ResolvedVariant,
  varContext: VariableContext,
  langGenService: LanguageGeneratorService
): Variant {
  switch (rawVariant.type) {
    case ResponseVariantType.TEXT:
      return new TextVariant(rawVariant, varContext);
    case ResponseVariantType.JSON:
      return new JSONVariant(rawVariant, varContext);
    case ResponseVariantType.PROMPT:
      return new PromptVariant(rawVariant, varContext, langGenService);
    default:
      throw new VError('unknown variant type encountered');
  }
}
