import { PromptCondition as RawPromptCondition } from '../../response.types';
import { BaseCondition } from './base.condition';

export class PromptCondition extends BaseCondition {
  constructor(protected readonly rawCondition: RawPromptCondition) {
    super(rawCondition);
  }

  evaluate(): boolean {
    return false;
  }
}
