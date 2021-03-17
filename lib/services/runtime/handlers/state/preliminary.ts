import { Node } from '@voiceflow/api-sdk';
import { Action, HandlerFactory } from '@voiceflow/runtime';

import { eventHandlers } from '..';
import { isGeneralRequest, isIntentRequest } from '../../types';
import CommandHandler from '../command';

const utilsObj = {
  commandHandler: CommandHandler(),
  eventHandlers,
};

/**
 * If request comes in but runtime nodeID is not a node that handles events (i.e, interaction, capture, _v1, etc..) =>
 * Handle it here
 */
export const PreliminaryHandler: HandlerFactory<Node<any, any>, typeof utilsObj> = (utils) => ({
  canHandle: (node, runtime, variables, program) => {
    const request = runtime.getRequest();
    return (
      (isIntentRequest(request) || isGeneralRequest(request)) &&
      runtime.getAction() === Action.REQUEST &&
      !utils.eventHandlers.find((h) => h.canHandle(node, runtime, variables, program))
    );
  },
  handle: (node, runtime, variables) => {
    runtime.setAction(Action.RESPONSE);

    // check if there is a command in the stack that fulfills request
    if (utils.commandHandler.canHandle(runtime)) {
      return utils.commandHandler.handle(runtime, variables);
    }

    // return current id
    return node.id;
  },
});

export default () => PreliminaryHandler(utilsObj);
