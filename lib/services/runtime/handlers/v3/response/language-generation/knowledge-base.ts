import VError from '@voiceflow/verror';

import { KnowledgeBaseSettings } from './knowledge-base.interface';

export class KnowledgeBase {
  public async answer(prompt: string, settings: KnowledgeBaseSettings) {
    throw new VError(`Not implemented, prompt=${prompt}, settings=${settings}`);
  }
}
