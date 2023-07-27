import { BaseUtils } from '@voiceflow/base-types';

export interface LLMGenerationSettings {
  chatHistory: BaseUtils.ai.Message[];
  model?: BaseUtils.ai.GPT_MODEL;
  temperature?: number;
  maxTokens?: number;
  system?: string;
}
