import { ResolvedVariant } from '../response.types';
import { VariantCollectionArgs } from './variantCollection.interface';

export class VariantCollection {
  public readonly conditionedVariants: ResolvedVariant[];

  public readonly unconditionedVariants: ResolvedVariant[];

  constructor({ data, order }: VariantCollectionArgs) {
    this.conditionedVariants = [];
    this.unconditionedVariants = [];

    order.forEach((varID) => {
      const variant = data[varID];

      if (variant.condition) {
        this.conditionedVariants.push(variant);
      } else {
        this.unconditionedVariants.push(variant);
      }
    });
  }

  public sampleUnconditioned() {
    return this.unconditionedVariants[Math.floor(Math.random() * this.unconditionedVariants.length)];
  }
}
