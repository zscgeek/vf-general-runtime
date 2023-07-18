import VError from '@voiceflow/verror';

import { Variant } from './variant/variant';
import { VariantCollectionArgs } from './variantCollection.interface';

export class VariantCollection {
  private readonly conditionedVariants: Variant[];

  private readonly unconditionedVariants: Variant[];

  constructor({ data, order }: VariantCollectionArgs) {
    this.conditionedVariants = [];
    this.unconditionedVariants = [];

    order.forEach((varID) => {
      const variant = data[varID];

      if (variant.condition) {
        this.conditionedVariants.push(new Variant(variant));
      } else {
        this.unconditionedVariants.push(new Variant(variant));
      }
    });
  }

  private at(collection: Variant[], i: number) {
    if (i < 0 || i >= collection.length) {
      throw new VError('Access out-of-bounds in variant collection');
    }
    return collection[i];
  }

  /**
   * Returns the number of conditioned variants
   */
  public get conditionedLength() {
    return this.conditionedVariants.length;
  }

  /**
   * Returns the number of unconditioned variants
   */
  public get unconditionedLength() {
    return this.unconditionedVariants.length;
  }

  /**
   * Retrieves the i-th unconditioned variant
   */
  public uncond(i: number) {
    return this.at(this.unconditionedVariants, i);
  }

  /**
   * Retrieves the i-th conditioned variant
   */
  public cond(i: number) {
    return this.at(this.conditionedVariants, i);
  }
}
