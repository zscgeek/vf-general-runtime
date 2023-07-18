import VError from '@voiceflow/verror';

import { AttachmentType, ResolvedAttachment } from '../../response.types';
import { BaseAttachment } from './base.attachment';
import { CardAttachment } from './card.attachment';
import { MediaAttachment } from './video.attachment';

export function buildAttachment(rawCondition: ResolvedAttachment): BaseAttachment {
  switch (rawCondition.type) {
    case AttachmentType.MEDIA:
      return new MediaAttachment(rawCondition);
    case AttachmentType.CARD:
      return new CardAttachment(rawCondition);
    default:
      throw new VError('unknown attachment type encountered');
  }
}
