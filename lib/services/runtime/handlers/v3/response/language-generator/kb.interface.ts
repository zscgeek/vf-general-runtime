import { BaseModels, BaseUtils } from '@voiceflow/base-types';

import { AIResponse } from '../../../utils/ai';

export interface KnowledgeBaseSettings {
  chatHistory: BaseUtils.ai.Message[];
  persona?: BaseUtils.ai.AIModelParams;
}

export interface KnowledgeBaseConfig {
  documents: Record<string, BaseModels.Project.KnowledgeBaseDocument>;
  projectID: string;
  kbStrategy?: BaseModels.Project.KnowledgeBaseSettings;
}

interface BaseAnswerReturn {
  tokens: number;
  output: string | null;
}

export enum KnowledgeBaseErrorCode {
  FailedQuestionSynthesis = 'failed-question-synthesis',
  FailedKnowledgeRetrieval = 'failed-knowledge-retrieval',
  FailedAnswerSynthesis = 'failed-answer-synthesis',
}

interface NullAnswerReturn extends BaseAnswerReturn {
  tokens: number;
  output: null;
  error: {
    code: KnowledgeBaseErrorCode;
  };
}

interface ActualAnswerReturn extends BaseAnswerReturn {
  tokens: number;
  output: string;
  documents: {
    chunks: Array<{
      score: number;
      documentID: string;
      documentData: BaseModels.Project.KnowledgeBaseData;
    }>;
    query: AIResponse | null;
  };
}

export type AnswerReturn = ActualAnswerReturn | NullAnswerReturn;
