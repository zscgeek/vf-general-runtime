import { BaseTrace, BaseUtils, Trace } from '@voiceflow/base-types';

import { sanitizeSSML } from '@/lib/services/filter/utils';
import { isIntentRequest, isTextRequest, RuntimeRequest } from '@/lib/services/runtime/types';
import { Store } from '@/runtime';
import { Context, ContextHandler } from '@/types';

import { AbstractManager } from './utils';

/**
 * Manages a Transcript tracking the past Conversation History between the user and a Voiceflow program.
 * Transcripts are stored up to a certain maximum and if it becomes too long, the oldest messages in
 * the Transcript are removed.
 *
 * A Conversation History is partitioned into subsequences called "Turns" which correspond to a single
 * interaction with the `general-runtime`. A turn consists of:
 *  1. <= 1 user input (e.g. text utterance, intent payload) that triggered the turn
 *  2. >= 1 assistant messages that the assistant output in response to the user's input
 *
 * The Transcript represents a turn of the Conversation History by:
 *  1. One record containing the user's input (if any)
 *  2. Followed by ONE record that contains ALL of the assistant's output in that turn
 *
 * An example of a Transcript is shown below:
 *
 * ```js
 * [
 *      // Turn 1
 *      {
 *        "role": "assistant",
 *        "content": "This is the first message in your assistant.\nCard B\nWendy's A\nStarting buttons"
 *      },
 *      // Turn 2
 *      {
 *        "role": "user",
 *        "content": "Button A"
 *      },
 *      {
 *        "role": "assistant",
 *        "content": "Button A\nWaiting for an intent..."
 *      },
 *      // Turn 3
 *      {
 *        "role": "user",
 *        "content": "I want a large pizza"
 *      },
 *      {
 *        "role": "assistant",
 *        "content": "A large pizza"
 *      },
 *      // Turn 4
 *      {
 *        "role": "user",
 *        "content": "Capture this entire utterance."
 *      },
 *      {
 *        "role": "assistant",
 *        "content": "Message: Capture this entire utterance."
 *      },
 *      // Turn 5
 *      {
 *        "role": "user",
 *        "content": "pizza"
 *      },
 *      {
 *        "role": "assistant",
 *        "content": "Captured: pizza"
 *      }
 *    ]
 * ```
 */
class AIAssist extends AbstractManager implements ContextHandler {
  private static readonly MAX_STOREABLE_TURNS = 10;

  private static readonly MSGS_PER_TURN = 2; // 1 record for user input + 1 record for assistant output

  private static readonly MAX_MESSAGES = AIAssist.MSGS_PER_TURN * AIAssist.MAX_STOREABLE_TURNS + 1;

  static StorageKey = '_memory_';

  static getInput(request: RuntimeRequest) {
    return (isIntentRequest(request) && request.payload.query) || (isTextRequest(request) && request.payload) || null;
  }

  static injectOutput(variables: Store, trace: BaseTrace.TextTrace | BaseTrace.SpeakTrace) {
    const transcript = (variables.get(AIAssist.StorageKey) as BaseUtils.ai.Message[]) || [];

    const lastTranscript = transcript[transcript.length - 1];

    const content = trace.type === Trace.TraceType.SPEAK ? sanitizeSSML(trace.payload.message) : trace.payload.message;

    if (lastTranscript?.role === BaseUtils.ai.Role.ASSISTANT) {
      lastTranscript.content += `\n${content}`;
    } else {
      transcript.push({ role: BaseUtils.ai.Role.ASSISTANT, content });
      if (transcript.length > AIAssist.MAX_MESSAGES) transcript.shift();
    }

    variables.set(AIAssist.StorageKey, transcript);
  }

  handle = async (context: Context) => {
    if (!context.version?.projectID) return context;

    const { request } = context;

    const input = AIAssist.getInput(request);
    const transcript: BaseUtils.ai.Message[] = context.state.variables[AIAssist.StorageKey] || [];

    if (input) {
      const transcript: BaseUtils.ai.Message[] = context.state.variables[AIAssist.StorageKey] || [];
      transcript.push({ role: BaseUtils.ai.Role.USER, content: input });

      if (transcript.length > AIAssist.MAX_MESSAGES) transcript.shift();
    }

    return {
      ...context,
      state: {
        ...context.state,
        variables: {
          ...context.state.variables,
          [AIAssist.StorageKey]: transcript,
        },
      },
    };
  };
}

export default AIAssist;
