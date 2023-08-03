import { BaseLanguageGeneratorReturn } from './base.interface';

export abstract class BaseLanguageGenerator<
  Settings extends Record<string, any>,
  GeneratorReturn extends BaseLanguageGeneratorReturn = BaseLanguageGeneratorReturn
> {
  public abstract generate(prompt: string, settings: Settings): Promise<GeneratorReturn> | GeneratorReturn;
}
