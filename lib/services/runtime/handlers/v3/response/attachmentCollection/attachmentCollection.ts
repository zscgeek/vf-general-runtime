import { AttachmentType } from '../response.types';
import { BaseAttachment } from '../variant/attachment/base.attachment';

// $TODO$ - This code is duplicated. Need to abstract out or simplify.
export class AttachmentCollection {
  public readonly cardAttachments: BaseAttachment[];

  public readonly mediaAttachments: BaseAttachment[];

  constructor(attachments: BaseAttachment[]) {
    this.cardAttachments = [];
    this.mediaAttachments = [];

    attachments.forEach((attach) => {
      if (attach.type === AttachmentType.CARD) {
        this.cardAttachments.push(attach);
      } else {
        this.mediaAttachments.push(attach);
      }
    });
  }
}
