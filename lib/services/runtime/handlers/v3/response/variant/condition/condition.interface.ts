import { ExpressionCondition } from './expression.condition';
import { PromptCondition } from './prompt.condition';
import { ScriptCondition } from './script.condition';

export type Condition = ExpressionCondition | PromptCondition | ScriptCondition;
