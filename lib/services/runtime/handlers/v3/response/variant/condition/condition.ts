import VError from '@voiceflow/verror';

import { ConditionType, ResolvedCondition } from '../../response.types';
import { BaseCondition } from './base.condition';
import { ExpressionCondition } from './expression.condition';
import { PromptCondition } from './prompt.condition';
import { ScriptCondition } from './script.condition';

export function buildCondition(rawCondition: ResolvedCondition): BaseCondition {
  switch (rawCondition.type) {
    case ConditionType.PROMPT:
      return new PromptCondition(rawCondition);
    case ConditionType.EXPRESSION:
      return new ExpressionCondition(rawCondition);
    case ConditionType.SCRIPT:
      return new ScriptCondition(rawCondition);
    default:
      throw new VError('unknown condition type encountered');
  }
}
