import { BaseTrace } from '@/../libs/packages/base-types/build/cjs';

import { ResolvedVariant } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { buildAttachment } from './attachment/attachment';
import { BaseAttachment } from './attachment/base.attachment';
import { BaseCondition } from './condition/base.condition';
import { buildCondition } from './condition/condition';

export abstract class BaseVariant<Variant extends ResolvedVariant> {
  protected constructor(protected readonly rawVariant: Variant, protected readonly varContext: VariableContext) {}

  public abstract get trace(): BaseTrace.AnyTrace;

  public get cardLayout() {
    return this.rawVariant.cardLayout;
  }

  public get type(): Variant['type'] {
    return this.rawVariant.type;
  }

  public get condition(): BaseCondition | null {
    if (this.rawVariant.condition === null) return null;
    return buildCondition(this.rawVariant.condition, this.varContext);
  }

  public get attachments(): BaseAttachment[] {
    // $TODO$ - Convert to Attachment class
    return this.rawVariant.attachmentOrder.map((id) =>
      buildAttachment(this.rawVariant.attachments[id], this.varContext)
    );
  }
}
