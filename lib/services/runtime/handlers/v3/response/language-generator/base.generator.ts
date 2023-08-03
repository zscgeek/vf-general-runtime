import { LanguageGeneratorReturn } from './base.interface';

export abstract class BaseLanguageGenerator<T extends Record<string, any>> {
  public abstract generate(prompt: string, settings: T): Promise<LanguageGeneratorReturn> | LanguageGeneratorReturn;
}
