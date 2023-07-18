import { BaseTrace } from '@voiceflow/base-types';
import VError from '@voiceflow/verror';

import { CardAttachment as RawCardAttachment } from '../../response.types';
import { BaseAttachment } from './base.attachment';

export class CardAttachment extends BaseAttachment {
  constructor(protected readonly rawAttachment: RawCardAttachment) {
    super(rawAttachment);
  }

  get trace(): BaseTrace.VideoTrace {
    throw new VError('card attachments have no corresponding trace');
  }

  get content() {
    return this.rawAttachment.card;
  }
}
