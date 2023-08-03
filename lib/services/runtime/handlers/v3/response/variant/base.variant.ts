import { BaseTrace } from '@/../libs/packages/base-types/build/cjs';

import { ResolvedVariant } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { buildAttachment } from './attachment/attachment';
import { Attachment } from './attachment/attachment.interface';
import { buildCondition } from './condition/condition';
import { Condition } from './condition/condition.interface';

export abstract class BaseVariant<Variant extends ResolvedVariant> {
  private cachedCondition: Condition | null = null;

  private cachedAttachments: Attachment[] | null = null;

  protected constructor(protected readonly rawVariant: Variant, protected readonly varContext: VariableContext) {}

  public abstract trace(): (BaseTrace.AnyTrace | null) | Promise<BaseTrace.AnyTrace | null>;

  public get cardLayout() {
    return this.rawVariant.cardLayout;
  }

  public get type(): Variant['type'] {
    return this.rawVariant.type;
  }

  public get condition(): Condition | null {
    if (this.rawVariant.condition === null) return null;
    if (!this.cachedCondition) {
      this.cachedCondition = buildCondition(this.rawVariant.condition, this.varContext);
    }
    return this.cachedCondition;
  }

  public get attachments(): Attachment[] {
    if (!this.cachedAttachments) {
      this.cachedAttachments = this.rawVariant.attachmentOrder.map((id) =>
        buildAttachment(this.rawVariant.attachments[id], this.varContext)
      );
    }

    return this.cachedAttachments;
  }
}
