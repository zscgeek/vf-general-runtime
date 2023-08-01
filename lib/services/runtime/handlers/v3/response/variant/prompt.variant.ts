import { BaseTrace, BaseUtils } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import VError from '@voiceflow/verror';

import { KnowledgeBaseGenerator } from '../language-generator/kb.interface';
import { LLMGenerator } from '../language-generator/llm.interface';
import { serializeResolvedMarkup } from '../markupUtils/markupUtils';
import { ResolvedPromptVariant, ResponseContext } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { BaseVariant } from './base.variant';

export class PromptVariant extends BaseVariant<ResolvedPromptVariant> {
  constructor(
    rawVariant: ResolvedPromptVariant,
    varContext: VariableContext,
    private readonly llmGenerator: LLMGenerator,
    private readonly kbGenerator: KnowledgeBaseGenerator
  ) {
    super(rawVariant, varContext);
  }

  private async resolveByLLM(prompt: string, chatHistory: BaseUtils.ai.Message[]): Promise<BaseTrace.V3.TextTrace> {
    const {
      persona: { model: modelName, temperature, maxLength, systemPrompt },
    } = this.rawVariant.prompt;

    const resolvedSystem = systemPrompt ? serializeResolvedMarkup(this.varContext.resolveMarkup([systemPrompt])) : null;

    const { output } = await this.llmGenerator.generate(prompt, {
      ...(modelName && { model: modelName }),
      ...(temperature && { temperature }),
      ...(maxLength && { maxTokens: maxLength }),
      ...(systemPrompt && { prompt: resolvedSystem }),
      chatHistory,
    });

    return {
      type: BaseTrace.TraceType.TEXT,
      payload: {
        content: output ? [output] : [],
      },
    };
  }

  private async resolveByKB(prompt: string, chatHistory: BaseUtils.ai.Message[]): Promise<BaseTrace.V3.TextTrace> {
    const { output } = await this.kbGenerator.generate(prompt, {
      chatHistory,
    });

    return {
      type: BaseTrace.TraceType.TEXT,
      payload: {
        content: output ? [output] : [],
      },
    };
  }

  get type() {
    return this.rawVariant.type;
  }

  async trace(): Promise<BaseTrace.V3.TextTrace | null> {
    const { text } = this.rawVariant.prompt;
    const resolvedPrompt = serializeResolvedMarkup(this.varContext.resolveMarkup(text));
    // $TODO$ - Add past turns of chat messages
    // $TODO$ - Need to convert this into Markup resolution
    // $TODO$ - When turns is converted to Markup resolution, need to ensure previous is state backwards compatible
    //          or annouce a disclaimer.
    const variablesState = this.varContext.getVariableMap();
    const sanitizedVars = sanitizeVariables(variablesState);
    const chatHistory = ([] as BaseUtils.ai.Message[]).map((message) => ({
      ...message,
      content: replaceVariables(message.content, sanitizedVars),
    }));

    if ([ResponseContext.MEMORY, ResponseContext.PROMPT].includes(this.rawVariant.context)) {
      return this.resolveByLLM(resolvedPrompt, chatHistory);
    }
    if (this.rawVariant.context === ResponseContext.KNOWLEDGE_BASE) {
      return this.resolveByKB(resolvedPrompt, chatHistory);
    }
    throw new VError('prompt variant has an invalid NLP context type');
  }
}
