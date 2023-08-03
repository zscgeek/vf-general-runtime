import { BaseUtils } from '@voiceflow/base-types';

export interface LLMSettings {
  chatHistory: BaseUtils.ai.Message[];
  model?: BaseUtils.ai.GPT_MODEL;
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

export interface GenerateReturn {
  output: string | null;
  tokens: number;
}
