import { VariantCollection } from '../variantCollection/variantCollection';
import { evaluateAttachments } from './evaluateAttachments/evaluateAttachments';
import { evaluateCarousel } from './evaluateCarousel/evaluateCarousel';
import { evaluateResponse } from './evaluateResponse/evaluateResponse';

function selectUnconditioned(variants: VariantCollection) {
  const randomIndex = Math.floor(Math.random() * variants.unconditionedLength);
  return variants.uncond(randomIndex);
}

const selectConditioned = (/* variants: VariantCollection */) =>
  // $TODO$ - Evaluate each condition and return the first matching one. Otherwise return
  // `null` to indicate no conditioned variant was matched.
  null;

export const evaluateVariant = (variants: VariantCollection) => {
  // 1 - Select a variant
  const variant = selectConditioned() ?? selectUnconditioned(variants);

  // 2 - Output response trace
  const responseTrace = evaluateResponse(variant);

  // 3 - Output carousel trace
  const carouselTrace = evaluateCarousel(variant);

  // 4 - Output non-carousel attachments as tarces
  const attachmentTraces = evaluateAttachments(variant);

  // 5 - Aggregate traces ]
  const outputTraces = [responseTrace];
  if (carouselTrace) outputTraces.push(carouselTrace);
  return [...outputTraces, ...attachmentTraces];
};
