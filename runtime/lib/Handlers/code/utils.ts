import ivm from 'isolated-vm';
import _ from 'lodash';
import requireFromUrl from 'require-from-url/sync';
import { VM } from 'vm2';

import Store from '@/runtime/lib/Runtime/Store';

export const ivmExecute = (data: { code: string; variables: Record<string, any> }, callbacks?: Record<string, (...args: any) => any>) => {
  // Create isolate with 8mb max memory
  const isolate = new ivm.Isolate({ memoryLimit: 8 });
  // Create a context inside this isolate to run the code in and inject variables/funcs
  const context = isolate.createContextSync();

  // Get a Reference{} to the global object within the context.
  const jail = context.global;

  // set Promise to not do anthing in code
  jail.setSync('Promise', null);

  // add callbacks if exists
  if (callbacks) {
    Object.keys(callbacks).forEach((callbackName) => {
      // @ts-expect-error from ...args
      jail.setSync(callbackName, (...args) => {
        callbacks[callbackName](...args);
      });
    });
  }

  // add variables to context
  Object.keys(data.variables).forEach((key) => {
    jail.setSync(key, data.variables[key], { copy: true });
  });

  // run code with 2s timeout
  context.evalSync(data.code, { timeout: 2000 });

  const ret = Object.keys(data.variables).reduce((acc, key) => {
    // get new value of variable after code ran
    let val = jail.getSync(key);
    if (val instanceof ivm.Reference) {
      // For non-primitives like arrays or objects
      val = val.copySync();
    }
    acc[key] = Store.formatPayloadValue(val);
    return acc;
  }, {} as Record<string, any>);

  // delete isolate to regain memory
  isolate.dispose();
  return ret;
};

// eslint-disable-next-line import/prefer-default-export
export const vmExecute = (
  data: { code: string; variables: Record<string, any> },
  safe = true /* set to false when running in testing env */,
  callbacks?: Record<string, (...args: any) => any>
) => {
  const vm = new VM({
    timeout: 1000,
    sandbox: {
      Promise: null,
      ..._.cloneDeep(data.variables),
      requireFromUrl,
      ...callbacks,
    },
  });

  const clearContext = `
          (function() {
            Function = undefined;
            const keys = Object.getOwnPropertyNames(this).concat(['constructor']);
            keys.forEach((key) => {
              const item = this[key];
              if (!item || typeof item.constructor !== 'function') return;
              this[key].constructor = undefined;
            });
          })();`;

  vm.run(`${safe ? clearContext : ''} ${data.code}`);

  return Object.keys(data.variables).reduce<Record<string, any>>((acc, key) => {
    const newValue = vm.getGlobal(key);

    acc[key] = Store.formatPayloadValue(newValue);

    return acc;
  }, {});
};
