import { BaseTrace } from '@voiceflow/base-types';
import { InternalException } from '@voiceflow/exception';
import VError from '@voiceflow/verror';

import { LLMGeneration } from '../language-generation/llm-generation';
import { serializeResolvedMarkup } from '../markupUtils/markupUtils';
import { ResolvedPromptVariant, ResponseContext } from '../response.types';
import { VariableContext } from '../variableContext/variableContext';
import { BaseVariant } from './base.variant';

export interface AIBilling {
  consumeAITokensQuota(tokens: number): Promise<void>;
  checkAITokensQuota(): Promise<boolean>;
}

export enum PromptVariantEvents {
  QUOTA_EXCEEDED = 'token quota exceeded',
}

export class PromptVariant extends BaseVariant<ResolvedPromptVariant> {
  constructor(rawVariant: ResolvedPromptVariant, varContext: VariableContext, private readonly billing: AIBilling) {
    super(rawVariant, varContext);
  }

  get type() {
    return this.rawVariant.type;
  }

  async trace(): Promise<BaseTrace.V3.TextTrace> {
    if (!(await this.billing.checkAITokensQuota())) {
      throw new InternalException({
        message: 'token quota exceeded, could not resolved prompt-type response',
        details: { event: PromptVariantEvents.QUOTA_EXCEEDED },
      });
    }

    let retTrace: BaseTrace.V3.TextTrace | null = null;
    let tokenConsumption = 0;

    if ([ResponseContext.MEMORY, ResponseContext.PROMPT].includes(this.rawVariant.context)) {
      const llmGeneration = new LLMGeneration();

      const {
        text,
        persona: { model: modelName, temperature, maxLength, systemPrompt },
      } = this.rawVariant.prompt;

      const resolvedSystem = systemPrompt
        ? serializeResolvedMarkup(this.varContext.resolveMarkup([systemPrompt]))
        : null;
      const resolvedPrompt = serializeResolvedMarkup(this.varContext.resolveMarkup(text));

      const { output, tokens } = await llmGeneration.generate(resolvedPrompt, {
        ...(modelName && { model: modelName }),
        ...(temperature && { temperature }),
        ...(maxLength && { maxTokens: maxLength }),
        ...(systemPrompt && { prompt: resolvedSystem }),
        chatHistory: [],
      });

      tokenConsumption = tokens ?? 0;

      retTrace = {
        type: BaseTrace.TraceType.TEXT,
        payload: {
          content: output ? [output] : [],
        },
      };
    } else if (this.rawVariant.context === ResponseContext.KNOWLEDGE_BASE) {
      throw new VError('Not implemented');
    } else {
      throw new VError('prompt variant has an invalid NLP context type');
    }

    if (tokenConsumption > 0) {
      await this.billing.consumeAITokensQuota(tokenConsumption);
    }

    return retTrace;
  }
}
