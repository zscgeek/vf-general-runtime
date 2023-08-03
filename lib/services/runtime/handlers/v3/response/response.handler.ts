import { HandlerFactory } from '@/runtime';

import { evaluateVariant } from './evaluateVariant/evaluateVariant';
import { LanguageGeneratorService } from './language-generator/language-generator';
import { Channel, Language, ResponseNode } from './response.types';
import { selectDiscriminator } from './selectDiscriminator/selectDiscriminator';
import { translateVariants } from './translateVariants/translateVariants';
import { VariableContext } from './variableContext/variableContext';
import { buildVariant } from './variant/variant';

const BaseResponseHandler: HandlerFactory<ResponseNode, Record<string, never>> = (_) => ({
  canHandle: (node) => {
    // $TODO$ - Update this with actual trace type enum when Pedro finishes compiler work
    return (node.type as any) === 'response';
  },

  handle: async (node, runtime, variables) => {
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
      Object.values(node.data.responses)
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

    // 3 - Construct the variable context
    // $TODO$ - Need to identify the intents vs. entities then assign them property to the context
    const varContext = new VariableContext(variables.getState());

    // 4 - Wrap list of variants in Variant objects
    const langGenServiec = new LanguageGeneratorService(runtime);

    const variants = discriminator.variantOrder.map((varID) =>
      buildVariant(discriminator.variants[varID], varContext, langGenServiec)
    );

    // 6 - Construct sequence of traces by feeding variants into variant selector
    const traces = await evaluateVariant(variants);

    // 7 - Add sequence of traces to the output
    traces.forEach((trace) => runtime.trace.addTrace(trace));

    return node.nextId ?? null;
  },
});

export const ResponseHandler = () => BaseResponseHandler({});
