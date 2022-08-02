import { AuthSDK } from '@voiceflow/sdk-auth';
import fetch from 'node-fetch';

import { Config } from '@/types';

export type AuthType = AuthSDK<Permission>;

const Auth = (config: Config): AuthType =>
  new AuthSDK({ authServiceURI: config.AUTH_SERVICE_ENDPOINT, fetchPonyfill: fetch });

export default Auth;

// eslint-disable-next-line no-secrets/no-secrets
// Taken from creator-api https://github.com/voiceflow/creator-api/blob/09f38fc653c5cf3a57738eaa88c72b45dffe4f1b/lib/services/workspaceManager/constants.ts#L3
export enum Permission {
  PROJECT_READ = 'project:read',
  VERSION_READ = 'version:read',
}
