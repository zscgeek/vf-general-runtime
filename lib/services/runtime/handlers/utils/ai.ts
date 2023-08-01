import { BaseNode, BaseUtils } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';

import AI from '@/lib/clients/ai';
import AIAssist from '@/lib/services/aiAssist';
import { QuotaName } from '@/lib/services/billing';
import log from '@/logger';
import { Runtime } from '@/runtime';

import { TurnType } from '../../types';

export const getMemoryMessages = (variablesState: Record<string, unknown>) => [
  ...((variablesState?.[AIAssist.StorageKey] as BaseUtils.ai.Message[]) || []),
];

export const getMemoryMessagesString = (variablesState: Record<string, unknown>) => {
  return getMemoryMessages(variablesState)
    .map(({ content, role }) => (role === 'assistant' ? 'AI: ' : 'user: ') + content)
    .join('\n');
};

export interface AIResponse {
  output: string | null;
  messages?: BaseUtils.ai.Message[];
  prompt?: string;
  queryTokens: number;
  answerTokens: number;
  tokens: number;
  time: number;
}

export const EMPTY_AI_RESPONSE = {
  output: null,
  tokens: 0,
  time: 0,
  queryTokens: 0,
  answerTokens: 0,
};

export const fetchChat = async (
  params: BaseUtils.ai.AIModelParams & { messages: BaseUtils.ai.Message[] },
  variablesState: Record<string, unknown> = {}
): Promise<AIResponse> => {
  const model = AI.get(params.model);
  if (!model) return EMPTY_AI_RESPONSE;

  const sanitizedVars = sanitizeVariables(variablesState);
  const messages = params.messages.map((message) => ({
    ...message,
    content: replaceVariables(message.content, sanitizedVars),
  }));

  const system = replaceVariables(params.system, sanitizedVars);
  if (system) messages.unshift({ role: BaseUtils.ai.Role.SYSTEM, content: system });

  const { output, tokens, queryTokens, answerTokens, time } =
    (await model.generateChatCompletion(messages, params)) ?? EMPTY_AI_RESPONSE;

  return { messages, output, tokens, queryTokens, answerTokens, time };
};

export const fetchPrompt = async (
  params: BaseUtils.ai.AIModelParams & { mode: BaseUtils.ai.PROMPT_MODE; prompt: string },
  variablesState: Record<string, unknown> = {}
): Promise<AIResponse> => {
  const model = AI.get(params.model);
  if (!model) return EMPTY_AI_RESPONSE;

  const sanitizedVars = sanitizeVariables(variablesState);

  const system = replaceVariables(params.system, sanitizedVars);
  const prompt = replaceVariables(params.prompt, sanitizedVars);

  if (params.mode === BaseUtils.ai.PROMPT_MODE.MEMORY) {
    const messages = getMemoryMessages(variablesState);
    if (system) messages.unshift({ role: BaseUtils.ai.Role.SYSTEM, content: system });

    const { output, tokens, queryTokens, answerTokens, time } =
      (await model.generateChatCompletion(messages, params)) ?? EMPTY_AI_RESPONSE;

    return { output, tokens, queryTokens, answerTokens, time };
  }
  if (params.mode === BaseUtils.ai.PROMPT_MODE.MEMORY_PROMPT) {
    const messages = getMemoryMessages(variablesState);
    if (system) messages.unshift({ role: BaseUtils.ai.Role.SYSTEM, content: system });
    if (prompt) messages.push({ role: BaseUtils.ai.Role.USER, content: prompt });

    const { output, tokens, queryTokens, answerTokens, time } =
      (await model.generateChatCompletion(messages, params)) ?? EMPTY_AI_RESPONSE;

    return { output, tokens, messages, time, queryTokens, answerTokens };
  }

  if (!prompt) return EMPTY_AI_RESPONSE;

  const { output, tokens, queryTokens, answerTokens, time } =
    (await model.generateCompletion(prompt, params)) ?? EMPTY_AI_RESPONSE;

  return { prompt, output, tokens, queryTokens, answerTokens, time };
};

export const consumeResources = async (
  reference: string,
  runtime: Runtime,
  resources: { tokens?: number; time?: number } | null
) => {
  const { tokens = 0, time = 0 } = resources ?? {};

  const workspaceID = runtime.project?.teamID;
  runtime.turn.set(TurnType.ELAPSED_AI_TIME, runtime.turn.get(TurnType.ELAPSED_AI_TIME) ?? 0 + time);
  await runtime.services.billing
    .consumeQuota(workspaceID, QuotaName.OPEN_API_TOKENS, tokens)
    .catch((err: Error) =>
      log.error(`[${reference}] Error consuming quota for workspace ${workspaceID}: ${log.vars({ err })}`)
    );
};

export const checkTokens = async (runtime: Runtime, nodeType?: BaseNode.NodeType): Promise<boolean> => {
  const workspaceID = runtime.project?.teamID;

  if (await runtime.services.billing.checkQuota(workspaceID, QuotaName.OPEN_API_TOKENS)) return true;

  runtime.trace.debug('token quota exceeded', nodeType);
  return false;
};

// 90 seconds
export const MAX_ELAPSED_AI_TIME = 90 * 1000;

export const checkLLMTurnTimeout = (runtime: Runtime, nodeType?: BaseNode.NodeType): boolean => {
  if ((runtime.turn.get<number>(TurnType.ELAPSED_AI_TIME) ?? 0) < MAX_ELAPSED_AI_TIME) return true;

  runtime.trace.debug('llm turn timeout', nodeType);
  return false;
};
