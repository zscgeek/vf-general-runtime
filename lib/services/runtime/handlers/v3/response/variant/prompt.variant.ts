import { BaseTrace, BaseUtils } from '@voiceflow/base-types';
import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import VError from '@voiceflow/verror';
import { match } from 'ts-pattern';

import { ArrayOrElement } from '@/lib/utils/typeUtils';

import { KnowledgeBaseErrorCode } from '../language-generator/kb.interface';
import { LanguageGenerator } from '../language-generator/language-generator';
import { serializeResolvedMarkup } from '../markupUtils/markupUtils';
import { ResolvedPromptVariant, ResponseContext } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { BaseVariant } from './base.variant';

export class PromptVariant extends BaseVariant<ResolvedPromptVariant> {
  constructor(
    rawVariant: ResolvedPromptVariant,
    varContext: VariableContext,
    private readonly langGen: LanguageGenerator
  ) {
    super(rawVariant, varContext);
  }

  private async resolveByLLM(prompt: string, chatHistory: BaseUtils.ai.Message[]): Promise<BaseTrace.V3.TextTrace> {
    const {
      persona: { model: modelName, temperature, maxLength, systemPrompt },
    } = this.rawVariant.prompt;

    const resolvedSystem = systemPrompt ? serializeResolvedMarkup(this.varContext.resolveMarkup([systemPrompt])) : null;

    const { output } = await this.langGen.llm.generate(prompt, {
      ...(modelName && { model: modelName }),
      ...(temperature && { temperature }),
      ...(maxLength && { maxTokens: maxLength }),
      ...(systemPrompt && { prompt: resolvedSystem }),
      chatHistory,
    });

    return {
      type: BaseTrace.TraceType.V3_TEXT,
      payload: {
        content: output ? [output] : [],
      },
    };
  }

  private async resolveByKB(
    prompt: string,
    chatHistory: BaseUtils.ai.Message[]
  ): Promise<ArrayOrElement<BaseTrace.V3.TextTrace | BaseTrace.V3.DebugTrace>> {
    const genResult = await this.langGen.knowledgeBase.generate(prompt, {
      chatHistory,
    });

    if (genResult.output === null) {
      const message = match(genResult.error.code)
        .with(KnowledgeBaseErrorCode.FailedQuestionSynthesis, () =>
          this.toKnowledgeBaseError('Failed to parse the knowledge base query')
        )
        .with(KnowledgeBaseErrorCode.FailedKnowledgeRetrieval, () =>
          this.toKnowledgeBaseError('Failed to retrieve documents from the knowledge base to answer query')
        )
        .with(KnowledgeBaseErrorCode.FailedAnswerSynthesis, () =>
          this.toKnowledgeBaseError('Failed to generate an answer to the query')
        )
        .otherwise(() => this.toKnowledgeBaseError('Encountered an unknown error'));

      return {
        type: BaseTrace.TraceType.V3_DEBUG,
        payload: {
          code: BaseTrace.V3.Debug.DebugCode.KnowledgeBase,
          level: BaseTrace.V3.Debug.DebugInfoLevel.Error,
          details: {
            message,
          },
        },
      };
    }

    const { documents, output } = genResult;
    return [
      {
        type: BaseTrace.TraceType.V3_DEBUG,
        payload: {
          code: BaseTrace.V3.Debug.DebugCode.KnowledgeBase,
          level: BaseTrace.V3.Debug.DebugInfoLevel.Info,
          details: {
            ...documents,
          },
        },
      },
      {
        type: BaseTrace.TraceType.V3_TEXT,
        payload: {
          content: output ? [output] : [],
        },
      },
    ];
  }

  private toKnowledgeBaseError(message: string) {
    return `[Knowledge Base Error]: ${message}`;
  }

  get type() {
    return this.rawVariant.type;
  }

  async trace(): Promise<ArrayOrElement<BaseTrace.V3.TextTrace | BaseTrace.V3.DebugTrace>> {
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
