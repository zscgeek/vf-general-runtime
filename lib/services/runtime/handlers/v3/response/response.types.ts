// $TODO$ - Replace all of this with actual response type from Pedro's work
export enum Language {
  ENGLISH_US = 'en-us',
}

export enum Channel {
  DEFAULT = 'default',
}

export enum ResponseVariantType {
  JSON = 'json',
  PROMPT = 'prompt',

  /**
   * only available if the default interface is text
   */
  TEXT = 'text',
}

export enum CardLayout {
  CAROUSEL = 'carousel',
  LIST = 'list',
}

export enum ConditionType {
  EXPRESSION = 'expression',
  PROMPT = 'prompt',
  SCRIPT = 'script',
}

export enum ConditionOperation {
  IS = 'is',
  IS_NOT = 'is_not',

  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',

  GREATER_THAN = 'greater_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_THAN = 'less_than',
  LESS_OR_EQUAL = 'less_or_equal',

  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
}

export interface ConditionAssertion {
  operation: ConditionOperation;
  lhs: unknown;
  rhs: unknown;
}

export interface ConditionPredicate {
  operation: ConditionOperation;
  rhs: unknown;
}

export interface BaseCondition {
  type: ConditionType;
}

export interface ExpressionCondition extends BaseCondition {
  type: ConditionType.EXPRESSION;
  matchAll: boolean;
  assertions: Record<string, ConditionAssertion>;
}

export interface PromptCondition {
  type: ConditionType.PROMPT;
  turns: number;
  prompt: {
    name: string;
    text: unknown;
    persona: {
      name: string | null;
      model: string | null;
      temperature: number | null;
      maxLength: number | null;
      systemPrompt: string | null;
    } | null;
  };
  predictes: Record<string, ConditionPredicate>;
}

export interface ScriptCondition {
  type: ConditionType.SCRIPT;
  code: unknown;
}

export type ResolvedCondition = ExpressionCondition | PromptCondition | ScriptCondition;

export enum AttachmentType {
  CARD = 'card',
  MEDIA = 'media',
}

export interface BaseAttachment {
  type: AttachmentType;
}

export interface CardAttachment {
  type: AttachmentType.CARD;
  card: {
    title: string;
    description: string;
    buttonOrder: string[];
    buttons: Record<string, { label: string }>;
  };
}

export enum MediaDatatype {
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface MediaAttachment {
  type: AttachmentType.MEDIA;
  media: {
    name: string;
    datatype: MediaDatatype;
    isAsset: boolean;
    url: string;
  };
}

export type ResolvedAttachment = CardAttachment | MediaAttachment;

export interface ResolvedVariant {
  type: ResponseVariantType;
  speed: number;
  cardLayout: CardLayout;
  condition: ResolvedCondition | null;
  attachmentOrder: string[];
  attachments: Record<string, ResolvedAttachment>;
}

export interface ResolvedDiscriminator {
  language: Language;
  channel: Channel;
  variantOrder: string[];
  variants: Record<string, ResolvedVariant>;
}

export interface ResolvedResponse {
  responses: Record<string, ResolvedDiscriminator>;
}

export interface ResponseNode {
  id: string;
  type: 'response';
  data: {
    response: ResolvedResponse;
  };
  nextId: string;
}
