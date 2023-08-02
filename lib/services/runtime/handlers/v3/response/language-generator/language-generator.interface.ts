export interface LanguageGeneratorReturn {
  tokens: number;
  output: string | null;
  error?: {
    code: string;
  };
}

export interface LanguageGenerator<T extends Record<string, any>> {
  generate(prompt: string, settings: T): Promise<LanguageGeneratorReturn> | LanguageGeneratorReturn;
}
