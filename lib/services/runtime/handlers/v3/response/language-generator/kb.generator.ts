import { answerSynthesis, fetchKnowledgeBase, questionSynthesis } from '../../../utils/knowledgeBase';
import { AnswerReturn, KnowledgeBaseConfig, KnowledgeBaseGenerator, KnowledgeBaseSettings } from './kb.interface';

export class KnowledgeBase implements KnowledgeBaseGenerator {
  constructor(private readonly knowledgeBaseConfig: KnowledgeBaseConfig) {}

  public async generate(prompt: string, { chatHistory, variableMap }: KnowledgeBaseSettings): Promise<AnswerReturn> {
    const question = await questionSynthesis(prompt, chatHistory);
    if (!question?.output) {
      return {
        tokens: 0,
        output: null,
      };
    }

    const { projectID, kbStrategy } = this.knowledgeBaseConfig;
    const data = await fetchKnowledgeBase(projectID, question.output, kbStrategy);
    if (!data) {
      return {
        tokens: 0,
        output: null,
      };
    }

    const answer = await answerSynthesis({
      question: question.output,
      data,
      options: this.knowledgeBaseConfig.kbStrategy.summarization,
      variables: variableMap,
    });
    if (!answer?.output) {
      return {
        tokens: 0,
        output: null,
      };
    }

    const tokens = (question.tokens ?? 0) + (answer.tokens ?? 0);

    return {
      tokens,
      output: answer.output,
    };
  }
}
