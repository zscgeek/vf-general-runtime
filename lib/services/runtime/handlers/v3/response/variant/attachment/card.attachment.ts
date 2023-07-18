import { BaseTrace } from '@voiceflow/base-types';

import { CardAttachment as RawCardAttachment } from '../../response.types';
import { BaseAttachment } from './base.attachment';

export class CardAttachment extends BaseAttachment {
  constructor(protected readonly rawAttachment: RawCardAttachment) {
    super(rawAttachment);
  }

  get trace(): BaseTrace.VideoTrace {
    // $TODO$ - Implement this properly, not as a video trace
    return {
      type: BaseTrace.TraceType.VIDEO,
      payload: {
        url: 'to implement',
      },
    };
  }
}
