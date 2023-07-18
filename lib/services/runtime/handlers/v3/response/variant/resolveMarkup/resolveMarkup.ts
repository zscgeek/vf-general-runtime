import { EntityReference, Markup, MarkupNode, MarkupSpan, VariableReference } from '../../response.types';

const isVariableReference = (markupNode: MarkupNode): markupNode is VariableReference =>
  VariableReference.safeParse(markupNode).success;

const isEntityReference = (markupNode: MarkupNode): markupNode is EntityReference =>
  EntityReference.safeParse(markupNode).success;

const isMarkupSpan = (markupNode: MarkupNode): markupNode is MarkupSpan => MarkupSpan.safeParse(markupNode).success;

// $TODO$ - Implement the actual resolution
function resolveMarkupNode(markupNode: MarkupNode): string {
  if (typeof markupNode === 'string') {
    return markupNode;
  }

  if (isVariableReference(markupNode)) {
    throw new Error('received unexpected markup content');
  }

  if (isEntityReference(markupNode)) {
    throw new Error('received unexpected markup content');
  }

  if (isMarkupSpan(markupNode)) {
    throw new Error('received unexpected markup content');
  }

  throw new Error('received unexpected markup content');
}

const resolveMarkupCollection = (markup: Markup): string => markup.map(resolveMarkupNode).join('');

export const resolveMarkup = (markup: Markup): string => resolveMarkupCollection(markup);
