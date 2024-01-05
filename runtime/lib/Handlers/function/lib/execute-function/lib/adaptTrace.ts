import { BaseNode, BaseTrace } from '@voiceflow/base-types';
import cuid from 'cuid';

import {
  SimpleCarouselTrace,
  SimpleTextTrace,
  SimpleTrace,
  SimpleTraceDTO,
  SimpleVisualTrace,
  Trace,
} from '../../../runtime-command/trace-command.dto';

const adaptTextTrace = (trace: SimpleTextTrace): BaseTrace.TextTrace => ({
  ...trace,
  payload: {
    slate: {
      id: 'dummy',
      content: [{ children: [{ text: trace.payload.message }] }],
    },
    ...trace.payload,
  },
});

const adaptVisualTrace = (trace: SimpleVisualTrace): BaseTrace.VisualTrace => ({
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
});

const adaptCarouselTrace = (trace: SimpleCarouselTrace): BaseTrace.CarouselTrace => ({
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
});

const isSimpleTrace = (trace: Trace): trace is SimpleTrace => SimpleTraceDTO.safeParse(trace).success;

export function adaptTrace(trace: Trace): BaseTrace.BaseTraceFrame {
  if (!isSimpleTrace(trace)) return trace as BaseTrace.BaseTraceFrame;

  switch (trace.type) {
    case BaseTrace.TraceType.TEXT:
      return adaptTextTrace(trace);
    case BaseTrace.TraceType.VISUAL:
      return adaptVisualTrace(trace);
    case BaseTrace.TraceType.CAROUSEL:
      return adaptCarouselTrace(trace);
    default:
      return trace;
  }
}
