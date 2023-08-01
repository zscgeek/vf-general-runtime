import { LLMSettings } from './llm.interface';

export type PromptQuestionSynthesisOptions = Omit<LLMSettings, 'chatHistory'>;
export type PromptAnswerSynthesisOptions = Omit<LLMSettings, 'chatHistory'>;
