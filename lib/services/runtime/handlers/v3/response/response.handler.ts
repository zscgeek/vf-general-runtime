import { HandlerFactory } from '@/runtime';

import { ResponseNode } from './response.types';

const ResponseHandler: HandlerFactory<ResponseNode, Record<string, never>> = (_) => ({
  canHandle: (node) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    return (node.type as any) === 'response';
  },

  handle: (node, runtime, _variables) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    runtime.trace.debug('__response__ - entered', 'response' as any);

    // 1 - Choose list of variants by picking the right discriminator

    // 2 - Wrap list of variants in Variant objects

    // 3 - Construct sequence of traces by feeding variants into variant selector
    // part a - Check all conditioned variants
    // part b - Randonly sample unconditioned variants

    // 4 - Add sequence of traces to the output

    return node.nextId ?? null;
  },
});

export default () => ResponseHandler({});
