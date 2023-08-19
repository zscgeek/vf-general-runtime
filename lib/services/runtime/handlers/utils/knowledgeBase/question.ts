import { BaseUtils } from '@voiceflow/base-types';

import { AIResponse, EMPTY_AI_RESPONSE, fetchChat } from '../ai';

const DEFAULT_QUESTION_SYNTHESIS_RETRY_DELAY_MS = 1500;
const DEFAULT_QUESTION_SYNTHESIS_RETRIES = 2;

export const questionSynthesis = async (question: string, memory: BaseUtils.ai.Message[] = []): Promise<AIResponse> => {
  if (memory.length > 1) {
    const contextMessages: BaseUtils.ai.Message[] = [...memory];

    if (memory[memory.length - 1].content === question) {
      contextMessages.push({
        role: BaseUtils.ai.Role.USER,
        content: 'frame the statement above so that it can be asked as a question to someone with no context.',
      });
    } else {
      contextMessages.push({
        role: BaseUtils.ai.Role.USER,
        content: `Based on our conversation, frame this statement: "${question}", so that it can be asked as a question to someone with no context.`,
      });
    }

    const response = await fetchChat(
      {
        temperature: 0.1,
        maxTokens: 128,
        model: BaseUtils.ai.GPT_MODEL.GPT_3_5_turbo,
        messages: contextMessages,
      },
      undefined,
      {
        retries: DEFAULT_QUESTION_SYNTHESIS_RETRIES,
        retryDelay: DEFAULT_QUESTION_SYNTHESIS_RETRY_DELAY_MS,
      }
    );

    if (response.output) return response;
  }

  return {
    ...EMPTY_AI_RESPONSE,
    output: question,
  };
};
