import VError from '@voiceflow/verror';

import { ResolvedVariant, ResponseVariantType } from '../../response.types';

export class Variant {
  constructor(private readonly rawVariant: ResolvedVariant) {}

  get content() {
    switch (this.rawVariant.type) {
      case ResponseVariantType.TEXT:
        return this.rawVariant.text;
      case ResponseVariantType.JSON:
        return this.rawVariant.json;
      case ResponseVariantType.PROMPT:
        return {
          prompt: this.rawVariant.promptID,
          turns: this.rawVariant.turns,
          context: this.rawVariant.context,
        };
      default:
        throw new VError('Received an unexpected variant type');
    }
  }
}
