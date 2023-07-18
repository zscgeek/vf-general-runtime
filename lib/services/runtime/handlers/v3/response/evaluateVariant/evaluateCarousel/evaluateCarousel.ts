import { BaseNode, BaseTrace } from '@voiceflow/base-types';
import VError from '@voiceflow/verror';

import { CardLayout } from '../../response.types';
import { Variant } from '../../variant/variant.interface';

function convertLayout(cardLayout: CardLayout): BaseNode.Carousel.CarouselLayout {
  switch (cardLayout) {
    case CardLayout.CAROUSEL:
      return BaseNode.Carousel.CarouselLayout.CAROUSEL;
    case CardLayout.LIST:
      return BaseNode.Carousel.CarouselLayout.LIST;
    default:
      throw new VError('unexpected value for card layout');
  }
}

export const evaluateCarousel = (variant: Variant): BaseTrace.Carousel => ({
  type: BaseTrace.TraceType.CAROUSEL,
  payload: {
    cards: [],
    layout: convertLayout(variant.cardLayout),
  },
});
