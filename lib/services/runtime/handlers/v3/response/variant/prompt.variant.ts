import { BaseModels, BaseTrace, BaseUtils } from '@voiceflow/base-types';
import { InternalException } from '@voiceflow/exception';
import VError from '@voiceflow/verror';

// import { KnowledgeBase } from '../language-generation/knowledge-base';
import { answerSynthesis, fetchKnowledgeBase, questionSynthesis } from '../../../utils/knowledgeBase';
import { LLMGeneration } from '../language-generation/llm-generation';
import { serializeResolvedMarkup } from '../markupUtils/markupUtils';
import { ResolvedPromptVariant, ResponseContext } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { BaseVariant } from './base.variant';

export interface AIBilling {
  consumeAITokensQuota(tokens: number): Promise<void>;
  checkAITokensQuota(): Promise<boolean>;
}

export interface KnowledgeBaseSettings {
  projectID: string;
  kbStrategy: BaseModels.Project.KnowledgeBaseSettings;
}

export enum PromptVariantEvents {
  QUOTA_EXCEEDED = 'token quota exceeded',
}

export class PromptVariant extends BaseVariant<ResolvedPromptVariant> {
  constructor(
    rawVariant: ResolvedPromptVariant,
    varContext: VariableContext,
    private readonly billing: AIBilling,
    private readonly knowledgeBaseSettings: KnowledgeBaseSettings
  ) {
    super(rawVariant, varContext);
  }

  private async resolveByLLM(prompt: string, chatHistory: BaseUtils.ai.Message[]) {
    const llmGeneration = new LLMGeneration();

    const {
      persona: { model: modelName, temperature, maxLength, systemPrompt },
    } = this.rawVariant.prompt;

    const resolvedSystem = systemPrompt ? serializeResolvedMarkup(this.varContext.resolveMarkup([systemPrompt])) : null;

    const { output, tokens } = await llmGeneration.generate(prompt, {
      ...(modelName && { model: modelName }),
      ...(temperature && { temperature }),
      ...(maxLength && { maxTokens: maxLength }),
      ...(systemPrompt && { prompt: resolvedSystem }),
      chatHistory,
    });

    const textTrace: BaseTrace.V3.TextTrace = {
      type: BaseTrace.TraceType.TEXT,
      payload: {
        content: output ? [output] : [],
      },
    };

    return {
      tokens: tokens ?? 0,
      trace: textTrace,
    };
  }

  private async resolveByKB(prompt: string, chatHistory: BaseUtils.ai.Message[]) {
    // $TODO$ - Move functionality over to knowledge base class.
    // const knowledgeBase = new KnowledgeBase();

    const question = await questionSynthesis(prompt, chatHistory);
    if (!question?.output) {
      return {
        tokens: 0,
        trace: null,
      };
    }

    const data = await fetchKnowledgeBase(
      this.knowledgeBaseSettings.projectID,
      question.output,
      this.knowledgeBaseSettings.kbStrategy
    );
    if (!data) {
      return {
        tokens: 0,
        trace: null,
      };
    }

    const answer = await answerSynthesis({
      question: question.output,
      data,
      options: this.knowledgeBaseSettings.kbStrategy.summarization,
      variables: this.varContext.getVariableMap(),
    });
    if (!answer?.output) {
      return {
        tokens: 0,
        trace: null,
      };
    }

    const tokens = (question.tokens ?? 0) + (answer.tokens ?? 0);

    const textTrace: BaseTrace.V3.TextTrace = {
      type: BaseTrace.TraceType.TEXT,
      payload: {
        content: answer.output ? [answer.output] : [],
      },
    };

    return {
      tokens,
      trace: textTrace,
    };
  }

  get type() {
    return this.rawVariant.type;
  }

  async trace(): Promise<BaseTrace.V3.TextTrace | null> {
    if (!(await this.billing.checkAITokensQuota())) {
      throw new InternalException({
        message: 'token quota exceeded, could not resolved prompt-type response',
        details: { event: PromptVariantEvents.QUOTA_EXCEEDED },
      });
    }

    let retTrace: BaseTrace.V3.TextTrace | null = null;
    let tokenConsumption = 0;

    const { text } = this.rawVariant.prompt;
    const resolvedPrompt = serializeResolvedMarkup(this.varContext.resolveMarkup(text));
    // $TODO$ - Add past turns of chat messages
    const chatHistory: BaseUtils.ai.Message[] = [];

    if ([ResponseContext.MEMORY, ResponseContext.PROMPT].includes(this.rawVariant.context)) {
      const { tokens, trace } = await this.resolveByLLM(resolvedPrompt, chatHistory);

      tokenConsumption = tokens;
      retTrace = trace;
    } else if (this.rawVariant.context === ResponseContext.KNOWLEDGE_BASE) {
      const { tokens, trace } = await this.resolveByKB(resolvedPrompt, chatHistory);

      tokenConsumption = tokens;
      retTrace = trace;
    } else {
      throw new VError('prompt variant has an invalid NLP context type');
    }

    if (tokenConsumption > 0) {
      await this.billing.consumeAITokensQuota(tokenConsumption);
    }

    return retTrace;
  }
}
