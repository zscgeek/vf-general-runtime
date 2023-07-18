import { BaseTrace } from '@voiceflow/base-types';

import { MediaAttachment as RawMediaAttachment } from '../../response.types';
import { BaseAttachment } from './base.attachment';

export class MediaAttachment extends BaseAttachment {
  constructor(protected readonly rawAttachment: RawMediaAttachment) {
    super(rawAttachment);
  }

  get trace(): BaseTrace.VideoTrace {
    return {
      type: BaseTrace.TraceType.VIDEO,
      payload: {
        url: this.rawAttachment.media.url,
      },
    };
  }
}
