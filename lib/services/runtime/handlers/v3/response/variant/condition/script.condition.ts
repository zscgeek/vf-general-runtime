import { ScriptCondition as RawScriptCondition } from '../../response.types';
import { BaseCondition } from './base.condition';

export class ScriptCondition extends BaseCondition {
  constructor(protected readonly rawCondition: RawScriptCondition) {
    super(rawCondition);
  }

  evaluate(): boolean {
    return false;
  }
}
