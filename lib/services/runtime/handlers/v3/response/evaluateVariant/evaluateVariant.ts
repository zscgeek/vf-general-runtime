import { BaseTrace } from '@voiceflow/base-types';

import { VariantCollection } from '../variantCollection/variantCollection';
import { evaluateAttachments } from './evaluateAttachments/evaluateAttachments';
import { evaluateCarousel } from './evaluateCarousel/evaluateCarousel';

function selectUnconditioned(variants: VariantCollection) {
  const randomIndex = Math.floor(Math.random() * variants.unconditionedVars.length);
  return variants.unconditionedVars[randomIndex];
}

const selectConditioned = (variants: VariantCollection) => {
  return variants.conditionedVars.find((vari) => vari.condition!.evaluate());
};

export const evaluateVariant = (variants: VariantCollection) => {
  // 1 - Select a variant
  const variant = selectConditioned(variants) ?? selectUnconditioned(variants);

  // 2 - Output response trace
  const responseTrace = variant.trace;

  // 3 - Output carousel trace
  const carouselTrace = evaluateCarousel(variant);

  // 4 - Output non-carousel attachments as tarces
  const attachmentTraces = evaluateAttachments(variant);

  // 5 - Aggregate traces
  const outputTraces: BaseTrace.BaseTraceFrame[] = [responseTrace];
  if (carouselTrace) outputTraces.push(carouselTrace);
  return [...outputTraces, ...attachmentTraces];
};
