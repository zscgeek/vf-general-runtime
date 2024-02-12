import { SystemVariable, VariableDatatype } from '@voiceflow/dtos';

import Store from '@/runtime/lib/Runtime/Store';

export const builtInVariableTypes = new Map(
  Object.entries({
    [SystemVariable.CHANNEL]: VariableDatatype.TEXT,
    [SystemVariable.INTENT_CONFIDENCE]: VariableDatatype.NUMBER,
    [SystemVariable.LAST_EVENT]: VariableDatatype.ANY,
    [SystemVariable.LAST_RESPONSE]: VariableDatatype.TEXT,
    [SystemVariable.LAST_UTTERANCE]: VariableDatatype.TEXT,
    [SystemVariable.LOCALE]: VariableDatatype.TEXT,
    [SystemVariable.PLATFORM]: VariableDatatype.TEXT,
    [SystemVariable.SESSIONS]: VariableDatatype.NUMBER,
    [SystemVariable.TIMESTAMP]: VariableDatatype.TEXT,
    [SystemVariable.USER_ID]: VariableDatatype.TEXT,
  })
);

export const createCombinedVariables = (global: Store, local: Store): Store => {
  return Store.merge(global, local);
};

export const saveCombinedVariables = (combined: Store, global: Store, local: Store) => {
  const updatedLocal: Record<string, any> = {};
  const updatedGlobal: Record<string, any> = {};

  combined.forEach(({ key, value }) => {
    if (local.has(key)) {
      updatedLocal[key] = value;
    } else if (global.has(key)) {
      updatedGlobal[key] = value;
    } else {
      // leftover/newly introduced variables saved locally to prevent pollution of global space
      updatedLocal[key] = value;
    }
  });

  local.merge(updatedLocal);
  global.merge(updatedGlobal);
};

export const mapStores = (map: [string, string][], from: Store, to: Store): void => {
  to.merge(
    map.reduce<Record<string, unknown>>((acc, [currentVal, newVal]) => {
      acc[newVal] = from.get(currentVal);
      return acc;
    }, {})
  );
};
