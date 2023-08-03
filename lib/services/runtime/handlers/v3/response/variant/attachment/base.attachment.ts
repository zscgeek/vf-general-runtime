import { BaseTrace } from '@voiceflow/base-types';

import { ResolvedAttachment } from '../../response.types';
import { VariableContext } from '../../variableContext/variableContext';

export abstract class BaseAttachment<Attachment extends ResolvedAttachment = ResolvedAttachment> {
  protected constructor(protected readonly rawAttachment: Attachment, protected readonly varContext: VariableContext) {}

  public get type(): typeof this.rawAttachment['type'] {
    return this.rawAttachment.type;
  }

  public abstract get trace(): BaseTrace.BaseTraceFrame;
}
