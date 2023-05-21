import { BaseUtils } from '@voiceflow/base-types';

import { fetchChat, Message } from '../ai';

export const questionSynthesis = async (question: string, memory: Message[]): Promise<string> => {
  if (memory.length > 1) {
    const contextMessages: Message[] = [...memory];

    if (memory[memory.length - 1].content === question) {
      contextMessages.push({
        role: 'user',
        content: 'frame the statement above so that it can be asked as a question to someone with no context.',
      });
    } else {
      contextMessages.push({
        role: 'user',
        content: `Based on our conversation, frame this statement: "${question}", so that it can be asked as a question to someone with no context.`,
      });
    }

    const response = await fetchChat({
      temperature: 0.1,
      maxTokens: 128,
      model: BaseUtils.ai.GPT_MODEL.GPT_3_5_turbo,
      messages: contextMessages,
    });

    if (response.output) return response.output;
  }

  return question;
};

const parseString = <T>(result: string, markers: [string, string]): T => {
  if (result.indexOf(markers[0]) === -1) {
    return JSON.parse(`${markers[0]}${result}${markers[1]}`);
  }

  return JSON.parse(result.substring(result.indexOf(markers[0]), result.lastIndexOf(markers[1]) + 1));
};

export const parseArrayString = <T>(result: string) => {
  return parseString<T>(result, ['[', ']']);
};

export const questionExpansion = async (question: string): Promise<string[]> => {
  const response = await fetchChat({
    temperature: 0.1,
    maxTokens: 128,
    model: BaseUtils.ai.GPT_MODEL.GPT_3_5_turbo,
    messages: [
      {
        role: 'user',
        content: `The following question needs to be searched against the knowledge base:\n"${question}"\n\nGive 3 possible queries to search against as a JSON string array.`,
      },
    ],
  });

  if (response.output) {
    try {
      const variations = parseArrayString<string[]>(response.output);
      if (variations.length > 0) return [question, ...variations];
    } catch (error) {
      // do nothing
    }
  }
  return [question];
};
