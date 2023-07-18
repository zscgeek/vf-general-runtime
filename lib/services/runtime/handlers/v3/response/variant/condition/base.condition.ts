import { ResolvedCondition } from '../../response.types';

export abstract class BaseCondition {
  protected constructor(protected readonly rawCondition: ResolvedCondition) {}

  public abstract evaluate(): boolean;
}
