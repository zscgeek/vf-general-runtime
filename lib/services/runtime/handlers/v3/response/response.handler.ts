import { HandlerFactory } from '@/runtime';

import { evaluateVariant } from './evaluateVariant/evaluateVariant';
import { Channel, Language, ResponseNode } from './response.types';
import { selectDiscriminator } from './selectDiscriminator/selectDiscriminator';
import { translateVariants } from './translateVariants/translateVariants';
import { buildVariant } from './variant/variant';
import { VariantCollection } from './variantCollection/variantCollection';

const ResponseHandler: HandlerFactory<ResponseNode, Record<string, never>> = (_) => ({
  canHandle: (node) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    return (node.type as any) === 'response';
  },

  handle: (node, runtime, _variables) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    runtime.trace.debug('__response__ - entered', 'response' as any);

    // $TODO$ - Replace this with the actual language and channel
    // $TODO$ - Default language should be based off of program information, not always EN_US
    const defaultLanguage = Language.ENGLISH_US;
    const currChannel = Channel.DEFAULT;
    const currLanguage = Language.ENGLISH_US;

    // 1 - Select discriminator for current language and channel, or fallback to default channel/language
    const { discriminator, language: actualLanguage } = selectDiscriminator(
      {
        currChannel,
        currLanguage,
        defaultLanguage,
      },
      Object.values(node.data.response.responses)
    );

    // 2 - Translate the variants if necessary
    if (currLanguage !== actualLanguage) {
      discriminator.variants = translateVariants(
        {
          fromLang: currLanguage,
          toLang: actualLanguage,
        },
        discriminator.variants
      );
    }

    // 3 - Wrap list of variants in Variant objects
    const variants = discriminator.variantOrder.map((varID) => buildVariant(discriminator.variants[varID]));

    // 4 - Construct a collection that independently tracks conditioned and unconditioned variants
    const variantCollection = new VariantCollection(variants);

    // 5 - Construct sequence of traces by feeding variants into variant selector
    const traces = evaluateVariant(variantCollection);

    // 6 - Add sequence of traces to the output
    traces.forEach((trace) => runtime.trace.addTrace(trace));

    return node.nextId ?? null;
  },
});

export default () => ResponseHandler({});
