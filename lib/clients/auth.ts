import { AuthSDK } from '@voiceflow/sdk-auth';
import fetch from 'node-fetch';

import { Config } from '@/types';

export type AuthType = AuthSDK;

const Auth = (config: Config): AuthType | null => {
  if (config.AUTH_API_URL) {
    return new AuthSDK({ authServiceURI: config.AUTH_API_URL, fetchPonyfill: fetch });
  }

  return null;
};

export default Auth;
