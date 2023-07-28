import { BaseModels, BaseUtils } from '@voiceflow/base-types';

export interface KnowledgeBaseSettings {
  documents: Record<string, BaseModels.Project.KnowledgeBaseDocument>;
  chatHistory: BaseUtils.ai.Message[];
}
