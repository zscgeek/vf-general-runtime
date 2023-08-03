import VError from '@voiceflow/verror';

import { AttachmentType, ResolvedAttachment } from '../../response.types';
import { VariableContext } from '../../variableContext/variableContext';
import { Attachment } from './attachment.interface';
import { CardAttachment } from './card.attachment';
import { MediaAttachment } from './media.attachment';

export function buildAttachment(rawCondition: ResolvedAttachment, varContext: VariableContext): Attachment {
  switch (rawCondition.type) {
    case AttachmentType.MEDIA:
      return new MediaAttachment(rawCondition, varContext);
    case AttachmentType.CARD:
      return new CardAttachment(rawCondition, varContext);
    default:
      throw new VError('unknown attachment type encountered');
  }
}
