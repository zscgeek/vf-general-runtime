import { JSONVariant } from './json.variant';
import { PromptVariant } from './prompt.variant';
import { TextVariant } from './text.variant';

export type Variant = JSONVariant | TextVariant | PromptVariant;
