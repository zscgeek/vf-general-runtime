import { Node } from '@voiceflow/base-types';
import axios from 'axios';
import _ from 'lodash';
import safeJSONStringify from 'safe-json-stringify';

import { HandlerFactory } from '@/runtime/lib/Handler';

import { vmExecute } from './utils';

export type CodeOptions = {
  endpoint?: string | null;
  callbacks?: Record<string, (...args: any) => any>;
  safe?: boolean;
};

const CodeHandler: HandlerFactory<Node.Code.Node, CodeOptions | void> = ({ endpoint, callbacks, safe } = {}) => ({
  canHandle: (node) => !!node.code,
  handle: async (node, runtime, variables, _program, options) => {
    try {
      let variablesState = variables.getState();
      if (options?.wrapVariables) {
        variablesState = {
          [options.wrapVariables]: variablesState,
        };
      }

      const reqData = {
        code: node.code,
        variables: variablesState,
      };

      const data = endpoint ? (await axios.post(endpoint, reqData)).data : vmExecute(reqData, safe, callbacks);

      let variablesStateRef = variablesState;
      let dataRef = data;

      if (options?.wrapVariables) {
        variablesStateRef = variablesState[options.wrapVariables];
        dataRef = data[options.wrapVariables];
      }

      // debugging changes find variable value differences
      const changes = _.union(Object.keys(variablesStateRef), Object.keys(dataRef)).reduce<string>((acc, variable) => {
        if (!_.isEqual(variablesStateRef[variable], dataRef[variable])) {
          acc += `\`{${variable}}\`: \`${JSON.stringify(variablesStateRef[variable])}\` => \`${JSON.stringify(dataRef[variable])}\`  \n`;
        }

        return acc;
      }, '');

      runtime.trace.debug(`evaluating code - ${changes ? `changes:  \n${changes}` : 'no variable changes'}`, Node.NodeType.CODE);

      variables.merge(dataRef);

      return node.success_id ?? null;
    } catch (error) {
      runtime.trace.debug(`unable to resolve code  \n\`${safeJSONStringify(error.response?.data || error.toString())}\``, Node.NodeType.CODE);

      return node.fail_id ?? null;
    }
  },
});

export default CodeHandler;
