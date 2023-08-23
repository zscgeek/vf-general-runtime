import { BaseNode, BaseUtils } from '@voiceflow/base-types';
import { Utils } from '@voiceflow/common';
import { VoiceNode } from '@voiceflow/voice-types';

import AI from '@/lib/clients/ai';
import { GPT4_ABLE_PLAN } from '@/lib/clients/ai/types';
import { HandlerFactory } from '@/runtime';

import { FrameType, Output } from '../types';
import { addOutputTrace, getOutputTrace } from '../utils';
import { AIResponse, checkTokens, consumeResources, fetchPrompt } from './utils/ai';
import { knowledgeBaseInteract } from './utils/knowledgeBase';
import { generateOutput } from './utils/output';
import { getVersionDefaultVoice } from './utils/version';

const AIResponseHandler: HandlerFactory<VoiceNode.AIResponse.Node> = () => ({
  canHandle: (node) => node.type === BaseNode.NodeType.AI_RESPONSE,
  handle: async (node, runtime, variables) => {
    const nextID = node.nextId ?? null;

    const generativeModel = AI.get(node.model);
    const kbModel = AI.get(runtime.project?.knowledgeBase?.settings?.summarization.model);

    if (!(await checkTokens(runtime, node.type))) {
      addOutputTrace(
        runtime,
        getOutputTrace({
          output: generateOutput('[token quota exceeded]', runtime.project),
          version: runtime.version,
          ai: true,
        })
      );
      return nextID;
    }

    if (node.source === BaseUtils.ai.DATA_SOURCE.KNOWLEDGE_BASE) {
      const { prompt } = node;

      const answer = await knowledgeBaseInteract(runtime, {
        ...runtime.project?.knowledgeBase?.settings?.summarization,
        prompt,
        mode: BaseUtils.ai.PROMPT_MODE.PROMPT,
      });

      await consumeResources('AI Response KB', runtime, kbModel, answer);

      // first versions of AI response KB didn't have elseId
      // checking for the property is required to not break existing flows
      if (!answer?.output && Utils.object.hasProperty(node, 'elseId')) return node.elseId ?? null;

      const output = generateOutput(
        answer?.output || 'Unable to find relevant answer.',
        runtime.project,
        node.voice ?? getVersionDefaultVoice(runtime.version)
      );

      runtime.trace.addTrace({
        type: 'knowledgeBase',
        payload: {
          chunks: answer?.chunks.map(({ score, documentID }) => ({
            score,
            documentID,
            documentData: runtime.project?.knowledgeBase?.documents?.[documentID]?.data,
          })),
          query: {
            output: answer?.query.output,
          },
        },
      } as any);

      addOutputTrace(
        runtime,
        getOutputTrace({
          output,
          variables,
          version: runtime.version,
          ai: true,
        }),
        { variables }
      );

      return nextID;
    }

    let response: AIResponse;
    if (node.model === BaseUtils.ai.GPT_MODEL.GPT_4 && runtime.plan && !GPT4_ABLE_PLAN.has(runtime.plan)) {
      response = {
        output: 'GPT-4 is only available on the Pro plan. Please upgrade to use this feature.',
        tokens: 0,
        queryTokens: 0,
        answerTokens: 0,
      };
    } else {
      response = await fetchPrompt(node, variables.getState());
    }

    await consumeResources('AI Response', runtime, generativeModel, response);

    if (!response.output) return nextID;

    const output = generateOutput(
      response.output,
      runtime.project,
      // use default voice if voice doesn't exist
      node.voice ?? getVersionDefaultVoice(runtime.version)
    );

    runtime.stack.top().storage.set<Output>(FrameType.OUTPUT, output);

    addOutputTrace(
      runtime,
      getOutputTrace({
        output,
        variables,
        version: runtime.version,
        ai: true,
      }),
      { variables }
    );

    return nextID;
  },
});

export default AIResponseHandler;
