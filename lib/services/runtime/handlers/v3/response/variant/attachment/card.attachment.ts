import { BaseTrace } from '@voiceflow/base-types';
import VError from '@voiceflow/verror';

import { CardAttachment as RawCardAttachment } from '../../response.types';
import { VariableContext } from '../../variableContext/variableContext';
import { BaseAttachment } from './base.attachment';

export class CardAttachment extends BaseAttachment {
  constructor(protected readonly rawAttachment: RawCardAttachment, varContext: VariableContext) {
    super(rawAttachment, varContext);
  }

  get trace(): BaseTrace.V3.VideoTrace {
    throw new VError('card attachments have no corresponding trace');
  }

  get content() {
    const { title, description } = this.rawAttachment.card;
    return {
      ...this.rawAttachment.card,
      title: this.varContext.resolve(title),
      description: this.varContext.resolve(description),
    };
  }
}
