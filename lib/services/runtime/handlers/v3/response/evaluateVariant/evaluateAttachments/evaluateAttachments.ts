import { AttachmentType } from '../../response.types';
import { BaseAttachment } from '../../variant/attachment/base.attachment';
import { Variant } from '../../variant/variant.interface';

const evaluateSingleAttachment = (attachment: BaseAttachment) =>
  attachment.type !== AttachmentType.CARD ? attachment.trace : null;

export const evaluateAttachments = (variant: Variant) =>
  variant.attachments.map(evaluateSingleAttachment).filter(<T>(val: T): val is Exclude<T, null> => val !== null);
