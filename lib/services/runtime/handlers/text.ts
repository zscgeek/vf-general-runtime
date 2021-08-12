import { replaceVariables, sanitizeVariables } from '@voiceflow/common';
import { NodeType, TraceType } from '@voiceflow/general-types';
import { Descendant, Node, TextData, TraceFrame } from '@voiceflow/general-types/build/nodes/text';
import _cloneDeepWith from 'lodash/cloneDeepWith';
import _isString from 'lodash/isString';
import _sample from 'lodash/sample';
import { Text } from 'slate';

import log from '@/logger';
import { HandlerFactory } from '@/runtime';

export const slateToPlaintext = (content: Descendant[] = []): string =>
  content.reduce((acc, n) => {
    acc += Text.isText(n) ? n.text : slateToPlaintext(n.children);
    return acc;
  }, '');

export const slateInjectVariables = (slate: TextData, variables: Record<string, unknown>) => {
  // return undefined to recursively clone object https://stackoverflow.com/a/52956848
  const customizer = (value: any) => (_isString(value) ? replaceVariables(value, variables, undefined, { trim: false }) : undefined);
  return _cloneDeepWith(slate, customizer);
};

const handlerUtils = {
  _sample,
  sanitizeVariables,
  slateToPlaintext,
  slateInjectVariables,
};

export const TextHandler: HandlerFactory<Node, typeof handlerUtils> = (utils) => ({
  canHandle: (node) => node.type === NodeType.TEXT,
  handle: (node, runtime, variables) => {
    const slate = utils._sample(node.texts);

    if (slate) {
      try {
        const sanitizedVars = utils.sanitizeVariables(variables.getState());
        const newSlate = utils.slateInjectVariables(slate, sanitizedVars);

        runtime.trace.addTrace<TraceFrame>({
          type: TraceType.TEXT,
          payload: { slate: newSlate, text: utils.slateToPlaintext(newSlate.content) },
        });
      } catch (error) {
        log.error(error);
      }
    }

    return node.nextId ?? null;
  },
});

export default () => TextHandler(handlerUtils);
