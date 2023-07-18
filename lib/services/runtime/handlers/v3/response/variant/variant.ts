import VError from '@voiceflow/verror';

import { ResolvedVariant, ResponseVariantType } from '../response.types';
import { JSONVariant } from './json.variant';
import { PromptVariant } from './prompt.variant';
import { TextVariant } from './text.variant';
import { Variant } from './variant.interface';

export function buildVariant(rawVariant: ResolvedVariant): Variant {
  switch (rawVariant.type) {
    case ResponseVariantType.TEXT:
      return new TextVariant(rawVariant);
    case ResponseVariantType.JSON:
      return new JSONVariant(rawVariant);
    case ResponseVariantType.PROMPT:
      return new PromptVariant(rawVariant);
    default:
      throw new VError('unknown variant type encountered');
  }
}
