import { HandlerFactory } from '@/runtime';

import { evaluateVariant } from './evaluateVariant/evaluateVariant';
import { Channel, Language, ResponseNode } from './response.types';
import { selectDiscriminator } from './selectDiscriminator/selectDiscriminator';
import { translateVariants } from './translateVariants/translateVariants';
import { VariantCollection } from './variantCollection/variantCollection';

const ResponseHandler: HandlerFactory<ResponseNode, Record<string, never>> = (_) => ({
  canHandle: (node) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    return (node.type as any) === 'response';
  },

  handle: (node, runtime, _variables) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    runtime.trace.debug('__response__ - entered', 'response' as any);

    const defaultLanguage = Language.ENGLISH_US;
    const currChannel = Channel.DEFAULT;
    const currLanguage = Language.ENGLISH_US;

    // 1 - Select discriminator for current language and channel, or fallback to default channel/language
    const { discriminator, language: actualLanguage } = selectDiscriminator(
      {
        currChannel,
        currLanguage,
        defaultLanguage, // $TODO$ - Default language should be based off of program information, not always EN_US
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
    const variantCollection = new VariantCollection({
      order: discriminator.variantOrder,
      data: discriminator.variants,
    });

    // 4 - Construct sequence of traces by feeding variants into variant selector
    // part a - Check all conditioned variants
    // part b - Randonly sample unconditioned variants

    /* const traces = */ evaluateVariant(variantCollection);

    // 5 - Add sequence of traces to the output

    return node.nextId ?? null;
  },
});

export default () => ResponseHandler({});
