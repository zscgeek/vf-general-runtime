import { BaseNode, BaseTrace } from '@voiceflow/base-types';
import { z } from 'zod';

export const TraceDTO = z
  .object({
    type: z.string({
      required_error: `A Voiceflow trace must define a 'type' property`,
      invalid_type_error: `Property 'type' of a Voiceflow trace must be a string`,
    }),
    payload: z.unknown().optional(),
  })
  .passthrough();

export type Trace = z.infer<typeof TraceDTO>;

export const TraceCommandDTO = z.array(TraceDTO, {
  invalid_type_error: 'A trace command must be a list of valid Voiceflow trace types',
});

export type TraceCommand = z.infer<typeof TraceCommandDTO>;

export const SimpleTextTraceDTO = TraceDTO.extend({
  type: z.literal(BaseTrace.TraceType.TEXT),
  payload: z.object({
    message: z.string(),
  }),
});

export type SimpleTextTrace = z.infer<typeof SimpleTextTraceDTO>;

export const SimpleDebugTraceDTO = TraceDTO.extend({
  type: z.literal(BaseTrace.TraceType.DEBUG),
  payload: z.object({
    message: z.string(),
  }),
});

export type SimpleDebugTrace = z.infer<typeof SimpleDebugTraceDTO>;

export const SimpleVisualTraceDTO = TraceDTO.extend({
  type: z.literal(BaseTrace.TraceType.VISUAL),
  payload: z.object({
    image: z.string(),
  }),
});

export type SimpleVisualTrace = z.infer<typeof SimpleVisualTraceDTO>;

export const SimpleCardDTO = z.object({
  imageUrl: z.string(),
  title: z.string(),
  description: z.object({
    text: z.string(),
  }),
});

export type SimpleCard = z.infer<typeof SimpleCardDTO>;

export const SimpleCardV2TraceDTO = TraceDTO.extend({
  type: z.literal(BaseTrace.TraceType.CARD_V2),
  payload: SimpleCardDTO,
});

export type SimpleCardV2Trace = z.infer<typeof SimpleCardV2TraceDTO>;

export const SimpleCarouselTraceDTO = TraceDTO.extend({
  type: z.literal(BaseTrace.TraceType.CAROUSEL),
  payload: z.object({
    layout: z.nativeEnum(BaseNode.Carousel.CarouselLayout),
    cards: z.array(SimpleCardDTO),
  }),
});

export type SimpleCarouselTrace = z.infer<typeof SimpleCarouselTraceDTO>;

export const SimpleTraceDTO = z.discriminatedUnion('type', [
  SimpleTextTraceDTO,
  SimpleDebugTraceDTO,
  SimpleVisualTraceDTO,
  SimpleCardV2TraceDTO,
  SimpleCarouselTraceDTO,
]);

export type SimpleTrace = z.infer<typeof SimpleTraceDTO>;
