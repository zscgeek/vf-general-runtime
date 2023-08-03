export interface BaseLanguageGeneratorReturn {
  tokens: number;
  output: string | null;
  error?: {
    code: string;
  };
}
