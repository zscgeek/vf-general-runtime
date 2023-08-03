import { InternalException } from '@voiceflow/exception';

import { Runtime } from '@/runtime';

import { BaseLanguageGenerator } from './base.generator';
import { BilledGenerator } from './billed.generator';
import { KnowledgeBase } from './kb.generator';
import { KnowledgeBaseSettings } from './kb.interface';
import { LLM } from './llm.generator';
import { LLMSettings } from './llm.interface';

export class LanguageGeneratorService {
  public readonly llm: BaseLanguageGenerator<LLMSettings>;

  public readonly knowledgeBase: BaseLanguageGenerator<KnowledgeBaseSettings>;

  constructor(runtime: Runtime) {
    this.llm = new BilledGenerator(runtime, new LLM());

    if (!runtime.project) {
      throw new InternalException({ message: 'runtime could not evaluate the project associated with the program' });
    }

    this.knowledgeBase = new BilledGenerator(
      runtime,
      new KnowledgeBase({
        documents: runtime.project.knowledgeBase?.documents ?? {},
        projectID: runtime.project._id,
        kbStrategy: runtime.project.knowledgeBase?.settings,
      })
    );
  }
}
