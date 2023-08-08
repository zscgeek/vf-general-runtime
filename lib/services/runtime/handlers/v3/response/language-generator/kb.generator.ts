import { BaseUtils } from '@voiceflow/base-types';
import dedent from 'dedent';

import { fetchKnowledgeBase, KnowledegeBaseChunk } from '../../../utils/knowledgeBase';
import { BaseLanguageGenerator } from './base.generator';
import { AnswerReturn, KnowledgeBaseConfig, KnowledgeBaseErrorCode, KnowledgeBaseSettings } from './kb.interface';
import { PromptQuestionSynthesisOptions } from './kb.types';
import { LLM } from './llm.generator';

export class KnowledgeBase implements BaseLanguageGenerator<KnowledgeBaseSettings> {
  private readonly llmGenerator: LLM;

  private static readonly DEFAULT_SYNTHESIS_SYSTEM: string =
    'Always summarize your response to be as brief as possible and be extremely concise. Your responses should be fewer than a couple of sentences.';

  constructor(private readonly knowledgeBaseConfig: KnowledgeBaseConfig) {
    this.llmGenerator = new LLM();
  }

  private promptQuestionSynthesis(
    prompt: string,
    chatHistory: BaseUtils.ai.Message[],
    options?: PromptQuestionSynthesisOptions
  ) {
    const { model = BaseUtils.ai.GPT_MODEL.GPT_3_5_turbo, system = '', temperature, maxTokens } = options ?? {};

    let content: string;

    if (chatHistory.length) {
      const history = chatHistory.map((turn) => `${turn.role}: ${turn.content}`).join('\n');
      content = dedent`
      <Conversation_History>
        ${history}
      </Conversation_History>
  
      <Instructions>${prompt}</Instructions>
  
      Using <Conversation_History> as context, you are searching a text knowledge base to fulfill <Instructions>. Write a sentence to search against.`;
    } else {
      content = dedent`
      <Instructions>${prompt}</Instructions>
  
      You can search a text knowledge base to fulfill <Instructions>. Write a sentence to search against.`;
    }

    return this.llmGenerator.generate(content, {
      model,
      system,
      temperature,
      maxTokens,
    });
  }

  private promptAnswerSynthesis(
    prompt: string,
    chatHistory: BaseUtils.ai.Message[],
    knowledgeChunks: KnowledegeBaseChunk[],
    options?: PromptQuestionSynthesisOptions
  ) {
    const {
      model = BaseUtils.ai.GPT_MODEL.CLAUDE_V1,
      system = KnowledgeBase.DEFAULT_SYNTHESIS_SYSTEM,
      temperature,
      maxTokens,
    } = options ?? {};

    const knowledge = knowledgeChunks.map(({ content }, index) => `<${index + 1}>${content}</${index + 1}>`).join('\n');
    let content: string;

    if (chatHistory.length) {
      const history = chatHistory.map((turn) => `${turn.role}: ${turn.content}`).join('\n');
      content = dedent`
      <Conversation_History>
        ${history}
      </Conversation_History>
  
      <Knowledge>
        ${knowledge}
      </Knowledge>
  
      <Instructions>${prompt}</Instructions>
  
      Using <Conversation_History> as context, fulfill <Instructions> ONLY using information found in <Knowledge>.`;
    } else {
      content = dedent`
      <Knowledge>
        ${knowledge}
      </Knowledge>
  
      <Instructions>${prompt}</Instructions>
  
      Fulfill <Instructions> ONLY using information found in <Knowledge>.`;
    }

    return this.llmGenerator.generate(content, {
      model,
      system,
      temperature,
      maxTokens,
    });
  }

  public async generate(prompt: string, { chatHistory, persona }: KnowledgeBaseSettings): Promise<AnswerReturn> {
    const generatedQuestion = await this.promptQuestionSynthesis(prompt, chatHistory);

    if (!generatedQuestion.output) {
      return {
        tokens: 0,
        output: null,
        error: {
          code: KnowledgeBaseErrorCode.FailedQuestionSynthesis,
        },
      };
    }

    const kbResult = await fetchKnowledgeBase(this.knowledgeBaseConfig.projectID, generatedQuestion.output);

    if (!kbResult) {
      return {
        tokens: 0,
        output: null,
        error: {
          code: KnowledgeBaseErrorCode.FailedKnowledgeRetrieval,
        },
      };
    }

    const kbPersona = persona ?? this.knowledgeBaseConfig.kbStrategy?.summarization;
    const generatedAnswer = await this.promptAnswerSynthesis(prompt, chatHistory, kbResult.chunks, kbPersona);

    if (!generatedAnswer.output) {
      return {
        tokens: 0,
        output: null,
        error: {
          code: KnowledgeBaseErrorCode.FailedAnswerSynthesis,
        },
      };
    }

    return {
      tokens: generatedQuestion.tokens + generatedAnswer.tokens,
      output: generatedAnswer.output,
      documents: {
        chunks: kbResult.chunks.map(({ score, documentID }) => ({
          score,
          documentID,
          documentData: this.knowledgeBaseConfig.documents[documentID].data,
        })),
        query: generatedQuestion,
      },
    };
  }
}
