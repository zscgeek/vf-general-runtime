import { Node } from '@voiceflow/base-types';
import axios from 'axios';
import _ from 'lodash';
import safeJSONStringify from 'safe-json-stringify';

import { HandlerFactory } from '@/runtime/lib/Handler';

import { ivmExecute, vmExecute } from './utils';

export type CodeOptions = {
  endpoint?: string | null;
  callbacks?: Record<string, (...args: any) => any>;
  safe?: boolean;
};

const CodeHandler: HandlerFactory<Node.Code.Node, CodeOptions | void> = ({ endpoint, callbacks } = {}) => ({
  canHandle: (node) => !!node.code,
  handle: async (node, runtime, variables) => {
    try {
      const variablesState = variables.getState();

      const reqData = {
        code: node.code,
        variables: variablesState,
      };

      // if requireFromUrl is used, use either axios or vm2
      // if requireFromUrl is not used, use isolated-vm
      // eslint-disable-next-line no-nested-ternary
      const data = node.code.includes('requireFromUrl')
        ? endpoint
          ? (await axios.post(endpoint, reqData)).data
          : vmExecute(reqData, true, callbacks)
        : ivmExecute(reqData, callbacks);

      // debugging changes find variable value differences
      const changes = _.union(Object.keys(variablesState), Object.keys(data)).reduce<string>((acc, variable) => {
        if (!_.isEqual(variablesState[variable], data[variable])) {
          acc += `\`{${variable}}\`: \`${JSON.stringify(variablesState[variable])}\` => \`${JSON.stringify(data[variable])}\`  \n`;
        }

        return acc;
      }, '');

      runtime.trace.debug(`evaluating code - ${changes ? `changes:  \n${changes}` : 'no variable changes'}`, Node.NodeType.CODE);

      variables.merge(data);

      return node.success_id ?? null;
    } catch (error) {
      runtime.trace.debug(`unable to resolve code  \n\`${safeJSONStringify(error.response?.data || error.toString())}\``, Node.NodeType.CODE);

      return node.fail_id ?? null;
    }
  },
});

export default CodeHandler;
