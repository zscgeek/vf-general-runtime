import { BaseNode, BaseTrace } from '@voiceflow/base-types';
import VError from '@voiceflow/verror';

import { CardLayout } from '../../response.types';
import { CardAttachment } from '../../variant/attachment/card.attachment';

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

const evaluateCard = (card: CardAttachment): BaseNode.Carousel.TraceCarouselCard => {
  const { title, description, buttons, buttonOrder } = card.content;
  return {
    id: 'asdf', // $TODO$ - Need good definition here for id
    title,
    description: {
      text: description,
      slate: [],
    },
    imageUrl: 'not-implemented', // $TODO$ - Need imageURL for this
    buttons: buttonOrder.map((id) => {
      const but = buttons[id];
      return {
        // $TODO$ - Need good values for buttons
        name: but.label,
        request: {
          type: but.label,
          payload: {
            label: but.label,
            actions: [],
          },
        },
      };
    }),
  };
};

export const evaluateCarousel = (cardLayout: CardLayout, cards: CardAttachment[]): BaseTrace.Carousel => ({
  type: BaseTrace.TraceType.CAROUSEL,
  payload: {
    cards: cards.map(evaluateCard),
    layout: convertLayout(cardLayout),
  },
});
