import { BaseUtils } from '@voiceflow/base-types';
import dedent from 'dedent';

import { AIResponse, EMPTY_AI_RESPONSE, fetchChat, fetchPrompt } from '../ai';
import { getCurrentTime } from '../generativeNoMatch';
import type { KnowledgeBaseResponse } from '.';

const DEFAULT_ANSWER_SYNTHESIS_RETRY_DELAY_MS = 4000;
const DEFAULT_ANSWER_SYNTHESIS_RETRIES = 2;

const generateContext = (data: KnowledgeBaseResponse) => {
  return data.chunks.map(({ content }, index) => `<${index + 1}>${content}</${index + 1}>`).join('\n');
};

export const filterNotFound = (output: string) => {
  const upperCase = output?.toUpperCase();
  if (upperCase?.includes('NOT_FOUND') || upperCase?.startsWith("I'M SORRY,") || upperCase?.includes('AS AN AI')) {
    return null;
  }
  return output;
};

export const answerSynthesis = async ({
  question,
  data,
  variables,
  options: { model = BaseUtils.ai.GPT_MODEL.CLAUDE_V1, system = '', temperature, maxTokens } = {},
}: {
  question: string;
  data: KnowledgeBaseResponse;
  variables?: Record<string, any>;
  options?: Partial<BaseUtils.ai.AIModelParams>;
}): Promise<AIResponse | null> => {
  let response: AIResponse = EMPTY_AI_RESPONSE;

  const systemWithTime = `${system}\n\n${getCurrentTime()}`.trim();

  const options = { model, system: systemWithTime, temperature, maxTokens };

  const context = generateContext(data);

  if ([BaseUtils.ai.GPT_MODEL.GPT_3_5_turbo, BaseUtils.ai.GPT_MODEL.GPT_4].includes(model)) {
    // for GPT-3.5 and 4.0 chat models
    const messages = [
      {
        role: BaseUtils.ai.Role.SYSTEM,
        content: dedent`
          <context>
            ${context}
          </context>
        `,
      },
      {
        role: BaseUtils.ai.Role.USER,
        content: dedent`
          Answer the following question using ONLY the provided <context>, if you don't know the answer say exactly "NOT_FOUND".

          Question:
          ${question}
        `,
      },
    ];

    response = await fetchChat({ ...options, messages }, variables, {
      retries: DEFAULT_ANSWER_SYNTHESIS_RETRIES,
      retryDelay: DEFAULT_ANSWER_SYNTHESIS_RETRY_DELAY_MS,
    });
  } else if ([BaseUtils.ai.GPT_MODEL.DaVinci_003].includes(model)) {
    // for GPT-3 completion model
    const prompt = dedent`
      <context>
        ${context}
      </context>

      If you don't know the answer say exactly "NOT_FOUND".\n\nQ: ${question}\nA: `;

    response = await fetchPrompt({ ...options, prompt, mode: BaseUtils.ai.PROMPT_MODE.PROMPT }, variables);
  } else if (
    [
      BaseUtils.ai.GPT_MODEL.CLAUDE_INSTANT_V1,
      BaseUtils.ai.GPT_MODEL.CLAUDE_V1,
      BaseUtils.ai.GPT_MODEL.CLAUDE_V2,
    ].includes(model)
  ) {
    const prompt = dedent`
      <information>
        ${context}
      </information>

      <question>${question}</question>

      If the question is not relevant to the provided <information>, print("NOT_FOUND").
      Otherwise, you may - very concisely - answer the user using only the relevant <information>.`;
    response = await fetchPrompt({ ...options, prompt, mode: BaseUtils.ai.PROMPT_MODE.PROMPT }, variables);
  }

  if (response.output) {
    response.output = filterNotFound(response.output.trim());
  }

  return response;
};
