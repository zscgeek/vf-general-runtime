import { GeneralRequest } from '@voiceflow/general-types/build';
import { Node, TraceFrame } from '@voiceflow/general-types/build/nodes/trace';
import { Action, HandlerFactory } from '@voiceflow/runtime';

import { isTracePathRequest } from '@/lib/services/runtime/types';

import CommandHandler from './command';

const utilsObj = {
  commandHandler: CommandHandler(),
};

const TraceHandler: HandlerFactory<Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node._v,
  handle: (node, runtime, variables) => {
    const defaultPath = node.paths[node.defaultPath!]?.nextID || null;

    const request: GeneralRequest | null = runtime.getRequest();

    // process req if not process before (action == REQUEST) and is of type trace
    if (runtime.getAction() === Action.REQUEST) {
      if (isTracePathRequest(request) && request.payload.name === node.name) {
        // request for this turn has been processed, set action to response
        runtime.setAction(Action.RESPONSE);

        return node.paths[request.payload.pathIndex!]?.nextID ?? defaultPath;
      }

      // check if there is a command in the stack that fulfills request
      if (utils.commandHandler.canHandle(runtime)) {
        return utils.commandHandler.handle(runtime, variables);
      }
    }

    runtime.trace.addTrace<TraceFrame>({
      type: node.type,
      payload: { data: node.data, paths: node.paths },
    });

    // if !stop continue to defaultPath otherwise
    // quit cycleStack without ending session by stopping on itself
    return !node.stop ? defaultPath : node.id;
  },
});

export default () => TraceHandler(utilsObj);
