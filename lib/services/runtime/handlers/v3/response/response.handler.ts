import { HandlerFactory } from '@/runtime';

import { evaluateVariant } from './evaluateVariant/evaluateVariant';
import { Language, ResponseNode } from './response.types';
import { VariableContext } from './variableContext/variableContext';
import { buildVariant } from './variant/variant';
import { VariantCollection } from './variantCollection/variantCollection';

const BaseResponseHandler: HandlerFactory<ResponseNode, Record<string, never>> = (_) => ({
  canHandle: (node) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    return (node.type as any) === 'response_v3';
  },

  handle: (node, runtime, variables) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    runtime.trace.debug('__response__ - entered', 'response' as any);

    // $TODO$ - Replace this with the actual language and channel
    // $TODO$ - Default language should be based off of program information, not always EN_US
    const channel = runtime.getChannel();
    const defaultLanguage = Language.ENGLISH_US;
    const currChannel = channel.name;
    const currLanguage = channel.language;

    // const defaultVariants = node.data.variants.filter((variant) => variant.language === defaultLanguage && variant.channel === currChannel);
    const specificVariants = node.data.variants.filter((variant) => variant.language === currLanguage && variant.channel === currChannel);

    const varContext = new VariableContext(variables.getState());

    const variants = specificVariants.map((variant) => buildVariant(variant, varContext));

    const variantCollection = new VariantCollection(variants);

    const traces = evaluateVariant(variantCollection);

    traces.forEach((trace) => runtime.trace.addTrace(trace));

    // // 1 - Select discriminator for current language and channel, or fallback to default channel/language
    // const { discriminator, language: actualLanguage } = selectDiscriminator(
    //   {
    //     currChannel,
    //     currLanguage,
    //     defaultLanguage,
    //   },
    //   Object.values(node.data.responses)
    // );

    // // 2 - Translate the variants if necessary
    // if (currLanguage !== actualLanguage) {
    //   discriminator.variants = translateVariants(
    //     {
    //       fromLang: currLanguage,
    //       toLang: actualLanguage,
    //     },
    //     discriminator.variants
    //   );
    // }

    // // 3 - Construct the variable context
    // // $TODO$ - Need to identify the intents vs. entities then assign them property to the context
    // const varContext = new VariableContext(variables.getState());

    // // 4 - Wrap list of variants in Variant objects
    // const variants = discriminator.variantOrder.map((varID) => buildVariant(discriminator.variants[varID], varContext));

    // // 5 - Construct a collection that independently tracks conditioned and unconditioned variants
    // const variantCollection = new VariantCollection(variants);

    // // 6 - Construct sequence of traces by feeding variants into variant selector
    // const traces = evaluateVariant(variantCollection);

    // // 7 - Add sequence of traces to the output
    // traces.forEach((trace) => runtime.trace.addTrace(trace));

    return node.nextId ?? null;
  },
});

export const ResponseHandler = () => BaseResponseHandler({});
