import { KnowledgeBaseGenerator } from '../language-generator/kb.interface';
import { LLMGenerator } from '../language-generator/llm.interface';
import { JSONVariant } from './json.variant';
import { PromptVariant } from './prompt.variant';
import { TextVariant } from './text.variant';

export type Variant = JSONVariant | TextVariant | PromptVariant;
export interface VariantServices {
  llm: LLMGenerator;
  knowledgeBase: KnowledgeBaseGenerator;
}
