import { BaseTrace } from '@voiceflow/base-types';

import { AttachmentType, ResolvedAttachment } from '../../response.types';

export abstract class BaseAttachment {
  protected constructor(protected readonly rawAttachment: ResolvedAttachment) {}

  public get type(): AttachmentType {
    return this.rawAttachment.type;
  }

  public abstract get trace(): BaseTrace.BaseTraceFrame;
}
