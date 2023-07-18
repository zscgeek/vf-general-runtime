import { ExpressionCondition as RawExpressionCondition } from '../../response.types';
import { BaseCondition } from './base.condition';

export class ExpressionCondition extends BaseCondition {
  constructor(protected readonly rawCondition: RawExpressionCondition) {
    super(rawCondition);
  }

  evaluate(): boolean {
    return false;
  }
}
