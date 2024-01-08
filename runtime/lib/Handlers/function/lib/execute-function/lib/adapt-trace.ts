import { BaseNode, BaseTrace } from '@voiceflow/base-types';
import cuid from 'cuid';

import {
  SimpleCardV2Trace,
  SimpleCarouselTrace,
  SimpleTextTrace,
  SimpleTrace,
  SimpleTraceDTO,
  SimpleVisualTrace,
  Trace,
} from '../../../runtime-command/trace-command.dto';

const adaptTextTrace = (trace: SimpleTextTrace): Trace => {
  return {
    ...trace,
    payload: {
      slate: {
        id: 'dummy',
        content: [{ children: [{ text: trace.payload.message }] }],
      },
      ...trace.payload,
    },
  } satisfies BaseTrace.TextTrace;
};

const adaptVisualTrace = (trace: SimpleVisualTrace): Trace => {
  return {
    ...trace,
    payload: {
      visualType: BaseNode.Visual.VisualType.IMAGE,
      device: BaseNode.Visual.DeviceType.DESKTOP,
      dimensions: {
        width: 480,
        height: 360,
      },
      canvasVisibility: BaseNode.Visual.CanvasVisibility.FULL,
      ...trace.payload,
    },
  } satisfies BaseTrace.VisualTrace;
};

const adaptCarouselTrace = (trace: SimpleCarouselTrace): Trace => {
  return {
    ...trace,
    payload: {
      layout: BaseNode.Carousel.CarouselLayout.CAROUSEL,
      ...trace.payload,
      cards: trace.payload.cards.map((item) => ({
        id: cuid.slug(),
        buttons: [],
        ...item,
      })),
    },
  } satisfies BaseTrace.CarouselTrace;
};

const adaptCardV2Trace = (trace: SimpleCardV2Trace): Trace => {
  return {
    ...trace,
    payload: {
      ...trace.payload,
      buttons: [],
    },
  } satisfies BaseTrace.CardV2;
};

const isSimpleTrace = (trace: Trace): trace is SimpleTrace => SimpleTraceDTO.safeParse(trace).success;

export function adaptTrace(trace: Trace): Trace {
  if (!isSimpleTrace(trace)) return trace;

  switch (trace.type) {
    case BaseTrace.TraceType.TEXT:
      return adaptTextTrace(trace);
    case BaseTrace.TraceType.VISUAL:
      return adaptVisualTrace(trace);
    case BaseTrace.TraceType.CAROUSEL:
      return adaptCarouselTrace(trace);
    case BaseTrace.TraceType.CARD_V2:
      return adaptCardV2Trace(trace);
    default:
      return trace;
  }
}
