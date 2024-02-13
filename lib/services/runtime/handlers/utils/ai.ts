import { BaseUtils } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';

import { CompletionOptions } from '@/lib/clients/ai/ai-model.interface';
import MLGateway from '@/lib/clients/ml-gateway';
import { Runtime } from '@/runtime';

import AIAssist from '../../../aiAssist';
import { GeneralRuntime } from '../../types';

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
  tokens: number;
  queryTokens: number;
  answerTokens: number;
  model: string;
  multiplier: number;
}

export const EMPTY_AI_RESPONSE: AIResponse = {
  output: null,
  tokens: 0,
  queryTokens: 0,
  answerTokens: 0,
  model: '',
  multiplier: 1,
};

export const fetchChat = async (
  params: BaseUtils.ai.AIModelParams & { messages: BaseUtils.ai.Message[] },
  mlGateway: MLGateway,
  options: CompletionOptions,
  variablesState: Record<string, unknown> = {}
): Promise<AIResponse> => {
  if (!mlGateway.private) return EMPTY_AI_RESPONSE;

  const sanitizedVars = sanitizeVariables(variablesState);
  const messages = params.messages.map((message) => ({
    ...message,
    content: replaceVariables(message.content, sanitizedVars),
  }));

  const { output, tokens, queryTokens, answerTokens, model, multiplier } =
    (await mlGateway.private.completion.generateChatCompletion({
      messages,
      params: { ...params, system: replaceVariables(params.system, sanitizedVars) },
      options,
      workspaceID: options.context.workspaceID,
      projectID: options.context.projectID,
      moderation: true,
      billing: true,
    })) ?? EMPTY_AI_RESPONSE;

  return { messages, output, tokens, queryTokens, answerTokens, model, multiplier };
};

export const fetchRuntimeChat = async ({
  runtime,
  params,
  options,
  resource,
}: {
  runtime: GeneralRuntime;
  params: BaseUtils.ai.AIModelParams & { messages: BaseUtils.ai.Message[] };
  options?: Partial<CompletionOptions>;
  resource: string;
}) => {
  const result = await fetchChat(
    params,
    runtime.services.mlGateway,
    { ...options, context: { projectID: runtime.version?.projectID, workspaceID: runtime.project!.teamID } },
    runtime.variables.getState()
  );

  consumeResources(resource, runtime, result);

  return result;
};

export const fetchPrompt = async (
  params: BaseUtils.ai.AIModelParams & { mode: BaseUtils.ai.PROMPT_MODE; prompt: string },
  mlGateway: MLGateway,
  options: CompletionOptions,
  variablesState: Record<string, unknown> = {}
): Promise<AIResponse> => {
  if (!mlGateway.private) return EMPTY_AI_RESPONSE;

  const sanitizedVars = sanitizeVariables(variablesState);

  const prompt = replaceVariables(params.prompt, sanitizedVars);

  let messages: BaseUtils.ai.Message[] = [];

  if (params.mode === BaseUtils.ai.PROMPT_MODE.MEMORY) {
    messages = getMemoryMessages(variablesState);
  } else if (params.mode === BaseUtils.ai.PROMPT_MODE.MEMORY_PROMPT) {
    messages = getMemoryMessages(variablesState);
    if (prompt) messages.push({ role: BaseUtils.ai.Role.USER, content: prompt });
  } else if (!prompt) {
    return EMPTY_AI_RESPONSE;
  } else {
    messages = [{ role: BaseUtils.ai.Role.USER, content: prompt }];
  }

  const { output, tokens, queryTokens, answerTokens, model, multiplier } =
    (await mlGateway.private.completion.generateChatCompletion({
      messages,
      params: {
        ...params,
        system: replaceVariables(params.system, sanitizedVars),
      },
      workspaceID: options.context.workspaceID,
      projectID: options.context.projectID,
      moderation: true,
      billing: true,
      options,
    })) ?? EMPTY_AI_RESPONSE;

  return { output, tokens, queryTokens, answerTokens, model, multiplier };
};

export const consumeResources = async (
  reference: string,
  runtime: Runtime,
  resources: { tokens?: number; queryTokens?: number; answerTokens?: number; model: string; multiplier: number } | null
) => {
  if (!resources) return;

  const { tokens = 0, queryTokens = 0, answerTokens = 0, model } = resources ?? {};
  const multiplier = resources?.multiplier ?? 1;
  const baseTokens = multiplier === 0 ? 0 : Math.ceil(tokens / multiplier);
  const baseQueryTokens = multiplier === 0 ? 0 : Math.ceil(queryTokens / multiplier);
  const baseAnswerTokens = multiplier === 0 ? 0 : Math.ceil(answerTokens / multiplier);

  runtime.trace.debug(
    `__${reference}__
    <br /> Model: \`${model}\`
    <br /> Token Multiplier: \`${multiplier}x\`
    <br /> Token Consumption: \`{total: ${baseTokens}, query: ${baseQueryTokens}, answer: ${baseAnswerTokens}}\`
    <br /> Post-Multiplier Token Consumption: \`{total: ${tokens}, query: ${queryTokens}, answer: ${answerTokens}}\``
  );
};
