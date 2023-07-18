import { ResolvedVariant } from '../response.types';

export interface VariantCollectionArgs {
  data: Record<string, ResolvedVariant>;
  order: string[];
}
