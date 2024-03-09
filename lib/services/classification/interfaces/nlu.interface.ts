export interface IntentPrediction {
  utterance: string;
  predictedIntent: string;
  predictedSlots: PredictedSlot[];
  confidence: number;
  intents: { name: string; confidence: number }[];
}

export interface PredictedSlot {
  name: string;
  value: string;
}

export interface PredictOptions {
  filteredIntents?: string[];
  filteredEntities?: string[];
}
