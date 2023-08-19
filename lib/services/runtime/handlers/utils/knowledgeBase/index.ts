import { BaseModels, BaseUtils } from '@voiceflow/base-types';
import axios from 'axios';

import Config from '@/config';
import AIAssist from '@/lib/services/aiAssist';
import log from '@/logger';
import { Runtime } from '@/runtime';

import { Output } from '../../../types';
import { getMemoryMessages } from '../ai';
import { generateOutput } from '../output';
import { answerSynthesis } from './answer';
import { questionSynthesis } from './question';
import { CloudEnv } from './types';

export { answerSynthesis, questionSynthesis };

export interface KnowledegeBaseChunk {
  score: number;
  chunkID: string;
  documentID: string;
  content: string;
}

export interface KnowledgeBaseResponse {
  chunks: KnowledegeBaseChunk[];
}

const FLAGGED_WORKSPACES_MAP = new Map<string, string[]>([
  [CloudEnv.Public, ['80627', 'Brk8AaGjlQ']],
  [CloudEnv.USBank, []],
]);

const { KL_RETRIEVER_SERVICE_HOST: host, KL_RETRIEVER_SERVICE_PORT: port } = Config;
const scheme = process.env.NODE_ENV === 'e2e' ? 'https' : 'http';
export const RETRIEVE_ENDPOINT = host && port ? new URL(`${scheme}://${host}:${port}/retrieve`).href : null;
export const { KNOWLEDGE_BASE_LAMBDA_ENDPOINT } = Config;

export const getAnswerEndpoint = (cloudEnv: string, workspaceID: string): string | null => {
  // check if env/workspace pair is flagged, if flagged workspaces list is empty, accept them all
  const flaggedWorkspaces = FLAGGED_WORKSPACES_MAP.get(cloudEnv);
  if (flaggedWorkspaces?.length === 0 || flaggedWorkspaces?.includes(String(workspaceID))) {
    return RETRIEVE_ENDPOINT;
  }

  if (!KNOWLEDGE_BASE_LAMBDA_ENDPOINT) return null;
  return `${KNOWLEDGE_BASE_LAMBDA_ENDPOINT}/answer`;
};

export const fetchKnowledgeBase = async (
  projectID: string,
  workspaceID: string | undefined,
  question: string,
  settings?: BaseModels.Project.KnowledgeBaseSettings
): Promise<KnowledgeBaseResponse | null> => {
  try {
    const cloudEnv = Config.CLOUD_ENV || '';
    const answerEndpoint = getAnswerEndpoint(cloudEnv, workspaceID || '');

    if (!answerEndpoint) return null;

    const { data } = await axios.post<KnowledgeBaseResponse>(answerEndpoint, {
      projectID,
      question,
      settings,
    });

    if (!data?.chunks?.length) return null;

    return data;
  } catch (err) {
    log.error(`[fetchKnowledgeBase] ${log.vars({ err })}`);
    return null;
  }
};

export const knowledgeBaseInteract = async (
  runtime: Runtime,
  params: BaseUtils.ai.AIContextParams & BaseUtils.ai.AIModelParams
) => {
  const { prompt } = params;

  const memory: BaseUtils.ai.Message[] = [];

  // only do question synthesis if mode is memory or memory_prompt
  if ([BaseUtils.ai.PROMPT_MODE.MEMORY_PROMPT, BaseUtils.ai.PROMPT_MODE.MEMORY].includes(params.mode)) {
    memory.push(...getMemoryMessages(runtime.variables.getState()));
  }

  const query = await questionSynthesis(prompt, memory);
  if (!query?.output) return null;

  const data = await fetchKnowledgeBase(runtime.project!._id, runtime.project?.teamID, query.output);
  if (!data) return null;

  // if there is no memory, query is just the same as prompt
  const answer = await answerSynthesis({
    question: query.output,
    options: params,
    data,
  });

  if (!answer?.output) return null;

  const tokens = (query.tokens ?? 0) + (answer.tokens ?? 0);

  const queryTokens = query.queryTokens + answer.queryTokens;
  const answerTokens = query.answerTokens + answer.answerTokens;

  return { ...answer, ...data, query, tokens, queryTokens, answerTokens };
};

export const knowledgeBaseNoMatch = async (
  runtime: Runtime
): Promise<{ output?: Output; tokens: number; queryTokens: number; answerTokens: number } | null> => {
  if (!RETRIEVE_ENDPOINT || !KNOWLEDGE_BASE_LAMBDA_ENDPOINT) {
    log.error('[knowledgeBase] one of RETRIEVE_ENDPOINT or KNOWLEDGE_BASE_LAMBDA_ENDPOINT is null');
    return null;
  }

  if (!runtime.project?._id) return null;

  const input = AIAssist.getInput(runtime.getRequest());
  if (!input) return null;

  try {
    const answer = await knowledgeBaseInteract(runtime, {
      mode: BaseUtils.ai.PROMPT_MODE.MEMORY,
      prompt: input,
    });

    if (!answer) return null;

    const { tokens, queryTokens, answerTokens, chunks, query } = answer;

    // KB NOT_FOUND still uses tokens
    if (!answer.output) return { tokens, queryTokens, answerTokens };

    // only add KB trace if result is success
    const documents = runtime.project?.knowledgeBase?.documents || {};

    runtime.trace.addTrace({
      type: 'knowledgeBase',
      payload: {
        chunks: chunks.map(({ score, documentID }) => ({
          score,
          documentID,
          documentData: documents[documentID]?.data,
        })),
        query: {
          messages: query.messages,
          output: query.output,
        },
      },
    } as any);

    return {
      output: generateOutput(answer.output, runtime.project),
      tokens,
      queryTokens,
      answerTokens,
    };
  } catch (err) {
    log.error(`[knowledge-base no match] ${log.vars({ err })}`);
    return null;
  }
};
