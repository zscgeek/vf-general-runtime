import axios from 'axios';

import Config from '@/config';
import Transcript from '@/lib/services/transcript';
import { Runtime } from '@/runtime';

export const generateNoMatch = async (runtime: Runtime): Promise<string | null> => {
  if (!Config.ML_GATEWAY_ENDPOINT) return null;
  const ML_GATEWAY_ENDPOINT = Config.ML_GATEWAY_ENDPOINT.split('/api')[0];

  const newInput = Transcript.getInput(runtime.getRequest());
  const transcript = runtime.storage.get<[string | null, string | null][]>(Transcript.StorageKey) || [];
  transcript.push([newInput, null]);

  const parsedTranscript = transcript.reduce((acc, [input, output]) => {
    if (input) acc += `User: ${input}\n`;
    if (output) acc += `AI: ${output}\n`;
    return acc;
  }, '');

  if (!parsedTranscript) return null;

  const autoCompleteEndpoint = `${ML_GATEWAY_ENDPOINT}/api/v1/generation/autocomplete`;

  console.log({ parsedTranscript });

  const response = await axios
    .post(autoCompleteEndpoint, {
      transcript: parsedTranscript,
    })
    .catch(() => null);

  console.log({ response: response?.data });

  return response?.data || null;
};
