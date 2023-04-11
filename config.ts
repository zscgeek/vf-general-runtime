/**
 * [[include:env.md]]
 * @packageDocumentation
 */

import './envSetup';

import { getOptionalProcessEnv, getRequiredProcessEnv } from '@voiceflow/backend-utils';

import { Config } from './types';

const NODE_ENV = getRequiredProcessEnv('NOD');
const CLOUD_ENV = getOptionalProcessEnv('CLOUD_', 'public');

const CONFIG: Config = {
  // configs
  NODE_ENV,
  PORT: getRequiredProcessEnv('PORT'),
  PORT_METRICS: getOptionalProcessEnv('PORT_METRICS'),
  ERROR_RESPONSE_MS: Number(getOptionalProcessEnv('ERROR_RESPONSE_MS', (20 * 1000).toString())),

  CLOUD_ENV,

  IS_PRIVATE_CLOUD: NODE_ENV === 'production' && CLOUD_ENV !== 'public',

  AWS_ENDPOINT: getOptionalProcessEnv('AWS_EN'),
  DYNAMO_ENDPOINT: getOptionalProcessEnv('DYN'),

  S3_ACCESS_KEY_ID: getOptionalProcessEnv('S3'),
  S3_SECRET_ACCESS_KEY: getOptionalProcessEnv('S3_'),
  S3_TLS_BUCKET: getOptionalProcessEnv('a'),
  S3_ENDPOINT: getOptionalProcessEnv('S3'),

  // code block
  CODE_HANDLER_ENDPOINT: getOptionalProcessEnv('CODE'),
  // integrations block
  INTEGRATIONS_HANDLER_ENDPOINT: getOptionalProcessEnv('INTEGRATIONS_HANDLER_ENDPOINT') || 'none',
  // api-block
  API_REQUEST_TIMEOUT_MS: Number(getOptionalProcessEnv('AP')) || null,
  API_MAX_CONTENT_LENGTH_BYTES: Number(getOptionalProcessEnv('API_MAX_CONTENT_LENGTH_BY')) || null,
  API_MAX_BODY_LENGTH_BYTES: Number(getOptionalProcessEnv('API_MAX_BODY_LENGT')) || null,

  PROJECT_SOURCE: getOptionalProcessEnv('PROJECT_SOURCE'),

  GENERAL_SERVICE_ENDPOINT: getOptionalProcessEnv('GENERAL_SERV'), // voiceflow nlu/tts services
  ML_GATEWAY_ENDPOINT: getOptionalProcessEnv('ML_GATEWAY_END'),
  NLU_GATEWAY_SERVICE_HOST: getOptionalProcessEnv('NLU_GATEW'),
  NLU_GATEWAY_SERVICE_PORT_APP: getOptionalProcessEnv('NLU_GA'),

  // creator-api config
  CREATOR_API_ENDPOINT: getOptionalProcessEnv('CREATOR_API_'),
  CREATOR_API_AUTHORIZATION: getOptionalProcessEnv('CREATOR_'),

  // creator-app config
  CREATOR_APP_ORIGIN: getOptionalProcessEnv('CREATOR_APP_'),
  DISABLE_ORIGIN_CHECK: getOptionalProcessEnv('DISABLE_ORI') === 'true',

  AWS_ACCESS_KEY_ID: getOptionalProcessEnv('AWS_ACCESS'),
  AWS_SECRET_ACCESS_KEY: getOptionalProcessEnv('AWS_SE'),
  AWS_REGION: getOptionalProcessEnv('AWS_RE'),

  // Release information
  GIT_SHA: getOptionalProcessEnv('GIT_SH'),
  BUILD_NUM: getOptionalProcessEnv('BUILD_'),
  SEM_VER: getOptionalProcessEnv('SEM_'),
  BUILD_URL: getOptionalProcessEnv('BUIL'),

  // Logging
  LOG_LEVEL: getOptionalProcessEnv('LOG_LEVEL'),
  MIDDLEWARE_VERBOSITY: getOptionalProcessEnv('MIDDLEWARE_VERBOSITY'),

  REDIS_CLUSTER_HOST: getOptionalProcessEnv('REDIS_CLUSTER_HOST'),
  REDIS_CLUSTER_PORT: Number(getOptionalProcessEnv('REDIS_CLUSTER_PORT', '6379')),

  // rate limiting
  // 1000 request per minute
  RATE_LIMITER_POINTS_PUBLIC: Number(getOptionalProcessEnv('RATE_LIMITER_POINTS_PUBLIC', '1000')),
  RATE_LIMITER_DURATION_PUBLIC: Number(getOptionalProcessEnv('RATE_LIMITER_DURATION_PUBLIC', '60')),
  // 500 requests per minute
  RATE_LIMITER_POINTS_PRIVATE: Number(getOptionalProcessEnv('RATE_LIMITER_POINTS_PRIVATE', '500')),
  RATE_LIMITER_DURATION_PRIVATE: Number(getOptionalProcessEnv('RATE_LIMITER_DURATION_PRIVATE', '60')),

  // SESSIONS SOURCE
  SESSIONS_SOURCE: getRequiredProcessEnv('SESSIONS_SOURCE'),
  MONGO_URI: getOptionalProcessEnv('MONGO_URI'),
  MONGO_DB: getOptionalProcessEnv('MONGO_DB'),

  ANALYTICS_ENDPOINT: getOptionalProcessEnv('ANALYTICS_ENDPOINT') || null,
  ANALYTICS_WRITE_KEY: getOptionalProcessEnv('ANALYTICS_WRITE_KEY') || null,

  INGEST_V2_WEBHOOK_ENDPOINT: getOptionalProcessEnv('INGEST_V2_WEBHOOK_ENDPOINT') || null,
};

export default CONFIG;
