import { FunctionCompiledVariableDeclaration, FunctionVariableType } from '@voiceflow/dtos';
import { z } from 'zod';

import { FunctionInputTypeException } from '../exceptions/function-input-type.exception';
import { FunctionRequiredVarException } from '../exceptions/function-required-var.exception';

const variableTypeValidators = new Map<FunctionVariableType, z.ZodType>([
  [FunctionVariableType.STRING, z.string()],
  [FunctionVariableType.NUMBER, z.number()],
  [FunctionVariableType.BOOLEAN, z.boolean()],
  [FunctionVariableType.OBJECT, z.record(z.any())],
  [FunctionVariableType.ARRAY, z.array(z.any())],
]);

function getZodValidator(type: FunctionVariableType) {
  const validator = variableTypeValidators.get(type)!;

  if (!validator) {
    throw new Error(`Unexpected function variable type '${type}'`);
  }

  return validator;
}

export function validateVariableValueTypes(
  declarations: Record<string, FunctionCompiledVariableDeclaration>,
  variableValues: Record<string, unknown>
) {
  const firstInvalid = Object.entries(declarations).find(([varName, declare]) => {
    const validator = getZodValidator(declare.type);
    return !validator.safeParse(variableValues[varName]).success;
  });

  if (firstInvalid) {
    const [varName, declare] = firstInvalid;

    if (typeof variableValues[varName] === 'undefined') {
      throw new FunctionRequiredVarException(varName);
    } else {
      throw new FunctionInputTypeException(varName, declare.type, variableValues[varName]);
    }
  }
}
