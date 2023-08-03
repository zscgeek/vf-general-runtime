export interface LanguageGeneratorReturn {
  tokens: number;
  output: string | null;
  error?: {
    code: string;
  };
}
