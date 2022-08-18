import { BaseNode, BaseTrace } from '@voiceflow/base-types';
import { replaceVariables } from '@voiceflow/common';

import { HandlerFactory } from '@/runtime';

import CommandHandler from './command';

const handlerUtils = {
  commandHandler: CommandHandler(),
  replaceVariables,
};

export const CardHandler: HandlerFactory<BaseNode.Card.Node, typeof handlerUtils> = (utils) => ({
  canHandle: (node) => node.type === BaseNode.NodeType.CARD,
  handle: (node, runtime, variables) => {
    runtime.trace.debug('__CARD GNR__ - entered', BaseNode.NodeType.CARD);
    const defaultPath = node.nextId || null;

    const variablesMap = variables.getState();

    const title = utils.replaceVariables(node.card.title, variablesMap);
    const text = utils.replaceVariables(node.card.text, variablesMap);

    runtime.trace.addTrace<BaseNode.Card.TraceFrame>({
      type: BaseTrace.TraceType.CARD,
      payload: {
        image: node.card.image,
        text,
        title,
        type: node.card.type,
      },
    });

    return defaultPath;
  },
});

export default () => CardHandler(handlerUtils);
