import { BaseTrace } from '@voiceflow/base-types';

import { Partition } from '@/lib/utils/partition';

import { AttachmentType } from '../response.types';
import { Variant } from '../variant/variant.interface';
import { evaluateCarousel } from './evaluateCarousel/evaluateCarousel';
import { VariantGroup } from './evaluateVariant.types';

function selectUnconditioned(variants: Partition<VariantGroup, Variant>) {
  const randomIndex = Math.floor(Math.random() * variants.group(VariantGroup.Unconditioned).length);
  return variants.group(VariantGroup.Unconditioned)[randomIndex];
}

const selectConditioned = (variants: Partition<VariantGroup, Variant>) => {
  return variants.group(VariantGroup.Conditioned).find((vari) => vari.condition!.evaluate());
};

export async function evaluateVariant(variants: Variant[]): Promise<Array<BaseTrace.BaseTraceFrame>> {
  // 0 - Sort variants into conditioned and unconditioned
  const variantCollection = new Partition<VariantGroup, Variant>(variants, Object.values(VariantGroup), (val) =>
    val.condition ? VariantGroup.Conditioned : VariantGroup.Unconditioned
  );

  // 1 - Select a variant
  const variant = selectConditioned(variantCollection) ?? selectUnconditioned(variantCollection);

  // 2 - Separate the card and non-card attachments
  const attachmentCollection = new Partition(
    variant.attachments,
    Object.values(AttachmentType),
    (attach) => attach.type
  );

  // 3 - Output response trace
  const responseTrace = await variant.trace();

  // 4 - Output carousel trace
  const cardAttachments = attachmentCollection.group(AttachmentType.CARD);
  const carouselTrace = cardAttachments.length ? evaluateCarousel(variant.cardLayout, cardAttachments) : null;

  // 5 - Output non-carousel attachments as traces
  const attachmentTraces = attachmentCollection.group(AttachmentType.MEDIA).map((attach) => attach.trace);

  // 6 - Aggregate traces
  const outputTraces: BaseTrace.BaseTraceFrame[] = [];
  if (responseTrace) {
    const responseTraceList = Array.isArray(responseTrace) ? responseTrace : [responseTrace];
    responseTraceList.forEach((trace) => outputTraces.push(trace));
  }
  if (carouselTrace) outputTraces.push(carouselTrace);
  return [...outputTraces, ...attachmentTraces];
}
