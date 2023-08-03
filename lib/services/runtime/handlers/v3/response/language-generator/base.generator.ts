import { LanguageGeneratorReturn } from './base.interface';

export abstract class BaseLanguageGenerator<
  Settings extends Record<string, any>,
  GeneratorReturn extends LanguageGeneratorReturn = LanguageGeneratorReturn
> {
  public abstract generate(prompt: string, settings: Settings): Promise<GeneratorReturn> | GeneratorReturn;
}
