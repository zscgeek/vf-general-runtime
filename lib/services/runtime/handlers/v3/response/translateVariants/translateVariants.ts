import VError from '@voiceflow/verror';

import { ResolvedVariant } from '../response.types';
import { TranslationContext } from './translateVariants.interface';

// $TODO$ - Need to ensure that the translation doesn't mess up the markup content
export function translateVariants(currContext: TranslationContext, variants: Record<string, ResolvedVariant>) {
  if (currContext.toLang !== currContext.fromLang) {
    throw new VError('Translation is not implemented');
  }

  return variants;
}
